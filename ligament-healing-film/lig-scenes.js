/* Patched, Not Rebuilt: scenes, captions, cards and timeline. */

/* ---------- shared states ---------- */
function mSnap(tt) {
  const s = F0(); s.t = tt; s.stretch = eio(seg(tt, 0, 2.6)); s.tension = seg(tt, 1.3, 2.6);
  if (tt >= 2.6) { s.snapped = true; s.stretch = 0; s.tension = 0; s.open = elasticOut(seg(tt, 2.6, 4.4)); s.flash = 1 - seg(tt, 2.6, 3.1); s.fasciaTear = eo(seg(tt, 2.6, 3.8)); s.bleed = .9 * seg(tt, 4.5, 10); }
  return s;
}
function lSnap(tt) {
  const s = LF0(); s.t = tt; s.crimp = 1 - eio(seg(tt, 0, 1.6)); s.stretch = seg(tt, 1.2, 2.6); s.tension = seg(tt, 1.6, 2.6);
  if (tt >= 2.6) { s.stretch = 0; s.tension = 0; s.tearP = (tt - 2.6) * .9; s.crimp = lerp(0, .3, seg(tt, 3.4, 5)); s.flash = 1 - seg(tt, 2.6, 3.1); s.epiTear = eo(seg(tt, 2.8, 4)); s.spurt = win(tt, 3, 9, 1); s.bleed = .6 * seg(tt, 4.5, 10); }
  return s;
}
const DAYK = [[0, 120], [5, 330], [9, 450], [28, 760], [180, 1180], [365, 1480]];
function dayX(d) { for (let i = 1; i < DAYK.length; i++) if (d <= DAYK[i][0]) return lerp(DAYK[i - 1][1], DAYK[i][1], (d - DAYK[i - 1][0]) / (DAYK[i][0] - DAYK[i - 1][0])); return 1480; }
function xDay(x) { for (let i = 1; i < DAYK.length; i++) if (x <= DAYK[i][1]) return lerp(DAYK[i - 1][0], DAYK[i][0], (x - DAYK[i - 1][1]) / (DAYK[i][1] - DAYK[i - 1][1])); return 365; }
function muscleAt(day, t) {
  const s = stInjured(t); s.bleed = 1; s.clot = seg(day, 0, .5); s.necro = seg(day, 0, .3); s.band = seg(day, .2, .4); s.cleared = seg(day, 1, 3);
  s.hyp = 1 - seg(day, 3, 6); s.granul = seg(day, 2, 7); s.vessels = seg(day, 3, 6); s.col3 = seg(day, 5, 12); s.myo = seg(day, 4, 8); s.fingers = seg(day, 6, 20); s.shrink = seg(day, 8, 24); s.zipper = seg(day, 7, 9);
  s.col1 = seg(day, 10, 30) * .6 + .4 * seg(day, 30, 180); s.col3 *= 1 - .9 * seg(day, 30, 120); s.align = seg(day, 30, 120); s.braid = seg(day, 40, 120); s.mature = seg(day, 21, 90); s.contract = seg(day, 40, 150); s.prune = seg(day, 20, 90);
  s.satGlow = seg(day, 1, 3) * (1 - .7 * seg(day, 14, 30)); s.nerveRegrow = seg(day, 17, 40); return s;
}
function ligAt(day, t) {
  const s = lInj(t); s.clot = seg(day, 0, 1); s.plt = seg(day, 0, .5); s.gf = seg(day, .5, 2); s.cellDeath = seg(day, 0, .3); s.deadClear = seg(day, 5, 9);
  s.granul = seg(day, 4, 12); s.granEdge = day < 10 ? 1 : 0; s.vessels = seg(day, 5, 9); s.col3 = seg(day, 6, 20) * (1 - .75 * seg(day, 60, 365)); s.col1End = seg(day, 7, 14);
  s.col1 = seg(day, 21, 180); s.align = seg(day, 30, 240); s.braid = seg(day, 180, 365); s.contract = seg(day, 60, 300); s.retract = seg(day, 180, 365); s.healed = .6 * seg(day, 180, 365); s.scarRecept = .35; s.bleed = 1 - .5 * seg(day, 3, 9);
  return s;
}
function panelLabel(ctx, x, y, txt, c = COL.accent) {
  ctx.save(); ctx.font = `700 20px ${F.mono}`; const w = ctx.measureText(txt).width + 26;
  ctx.fillStyle = 'rgba(8,11,18,.88)'; rr(ctx, x, y - 18, w, 36, 8); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = c; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + 13, y + 1); ctx.restore();
}

/* ---------- intro ---------- */
function introDraw(ctx, t) {
  const s = LF0(); s.t = t; drawLigField(ctx, s);
  ctx.fillStyle = 'rgba(6,8,13,.8)'; ctx.fillRect(0, 0, W, H);
  const a = seg(t, .2, 1.2);
  bigText(ctx, 'PEAK WELLNESS SPORTS CHIROPRACTIC  ·  CLINICAL EDUCATION', 800, 220, 19, a, { font: F.mono, weight: 500, color: COL.accent });
  bigText(ctx, 'PATCHED, NOT REBUILT', 800, 340, 124, a);
  bigText(ctx, 'How a ligament heals after a sprain, and why it isn\'t muscle', 800, 404, 32, seg(t, .8, 1.8), { font: F.body, weight: 500, color: '#c9d1de' });
  ctx.save(); ctx.globalAlpha *= seg(t, 1.6, 2.6);
  const items = [['HUMAN', 'human data'], ['ANIMAL', 'animal or lab data only'], ['MODEL/THEORY', 'proposed, not yet tested directly']];
  let total = 0; const ws = items.map(([k, d]) => { ctx.font = `700 15px ${F.mono}`; const pw = ctx.measureText(k).width + 18; ctx.font = `500 21px ${F.body}`; const w = pw + 10 + ctx.measureText(d).width; total += w; return [pw, w]; });
  total += 120; let x = 800 - total / 2;
  items.forEach(([k, d], i) => { tagPill(ctx, k, x, 500, 1); ctx.fillStyle = '#c9d1de'; ctx.font = `500 21px ${F.body}`; ctx.textBaseline = 'middle'; ctx.fillText(d, x + ws[i][0] + 10, 501); ctx.textBaseline = 'alphabetic'; x += ws[i][1] + 60; });
  ctx.restore();
  bigText(ctx, 'A companion to Inside the Strain', 800, 600, 22, seg(t, 2.6, 3.6), { font: F.body, weight: 500, color: COL.dim });
}

/* ---------- Scene 0: cold open ---------- */
function scene0(ctx, t) {
  bg(ctx);
  fieldIn(ctx, mSnap(t), 30, 130, 760, 600, .9, 800, 430);
  ligFieldIn(ctx, lSnap(t), 810, 130, 760, 600, .95);
  panelLabel(ctx, 50, 160, 'MUSCLE · HAMSTRING', '#ef8a9a'); panelLabel(ctx, 830, 160, 'LIGAMENT · MCL', LC.coll);
  bigText(ctx, 'SAME MOMENT  ·  SLOW MOTION', 800, 760, 16, win(t, .3, 9) * .8, { font: F.mono, weight: 600, color: COL.dim });
  const a = seg(t, 12.6, 13.6);
  if (a > 0) {
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(6,8,13,.78)'; rr(ctx, 330, 340, 940, 150, 16); ctx.fill();
    bigText(ctx, 'MUSCLE REGROWS.', 800, 405, 54, 1); bigText(ctx, 'LIGAMENT GETS PATCHED.', 800, 466, 54, 1, { color: COL.accent }); ctx.restore();
  }
}

/* ---------- Scene 1: normal anatomy ---------- */
function scene1(ctx, t) {
  const x = seg(t, 5, 6.2);
  if (x < 1) {
    bg(ctx, '#151a26', '#06080d');
    const k = eio(seg(t, 2.6, 6.2)), z = 1 + 2.4 * k;
    ctx.save(); ctx.translate(800, 450); ctx.scale(z, z); ctx.translate(-lerp(800, 690, k), -lerp(450, 470, k));
    const kp = knee(ctx, { x: 800, y: 470, s: .82, t, mclGlow: .25 + .25 * Math.sin(t * 3) }); ctx.restore();
    callout(ctx, 'MCL: medial collateral ligament', 160, 300, kp.mcl[0], kp.mcl[1], win(t, .5, 4.4));
  }
  if (x > 0) {
    ctx.save(); ctx.globalAlpha *= x; const s = LF0(); s.t = t; drawLigField(ctx, s);
    const r3 = LROWS[3];
    callout(ctx, 'Type I collagen in tight parallel bundles', 150, 150, 420, r3.y, win(t, 6.4, 14.4));
    callout(ctx, 'Crimp: the built-in wave', 1060, 150, 1180, LROWS[0].y, win(t, 8.6, 14.4));
    const c = LCELLS[6]; callout(ctx, 'Few cells: flattened fibroblasts', 150, 764, c.x, c.y, win(t, 10, 16.2), { color: 'rgba(240,138,48,.9)' });
    callout(ctx, 'Few small vessels dip inside', 1060, 764, DIPS[4][0] + 6, LIG.bot[0] - 30, win(t, 12, 16.6), { color: 'rgba(216,38,60,.9)' });
    callout(ctx, 'Epiligament: vessels and nerves', 150, 150, 500, LIG.top[0] + 18, win(t, 16.4, 23.4), { color: 'rgba(160,180,205,.95)' });
    const ec = EPICELLS.find(e => e.y > 400) || EPICELLS[1];
    callout(ctx, 'Backup cells live in the sheath', 1060, 764, ec.x, ec.y, win(t, 18.4, 23.4), { color: 'rgba(201,138,82,.95)' });
    callout(ctx, 'Mechanoreceptors: joint position sense', 1060, 150, RECEPT[3].x, RECEPT[3].y, seg(t, 23.6, 24.2), { color: 'rgba(244,214,60,.95)' });
    const sa = seg(t, 25, 25.6);
    if (sa > 0) { ctx.save(); ctx.globalAlpha *= sa; ctx.strokeStyle = COL.nerve; ctx.fillStyle = COL.nerve; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(470, 205); ctx.lineTo(470, 132); ctx.stroke(); ctx.beginPath(); ctx.moveTo(458, 140); ctx.lineTo(470, 120); ctx.lineTo(482, 140); ctx.fill(); ctx.restore(); callout(ctx, 'To the spinal cord and brain', 150, 150, 470, 128, sa, { color: 'rgba(244,214,60,.95)' }); }
    ctx.restore();
  }
}

/* ---------- Scene 2: the tear ---------- */
function s2field(tt) {
  const s = LF0(); s.t = tt + 6; s.crimp = 1 - eio(seg(tt, 0, 1.6)); s.stretch = seg(tt, .8, 1.8); s.tension = seg(tt, 1, 1.8);
  if (tt >= 1.8) { s.stretch = 0; s.tension = 0; s.tearP = (tt - 1.8) * .9; s.crimp = lerp(0, .3, seg(tt, 2.6, 4.5)); s.flash = 1 - seg(tt, 1.8, 2.3); s.epiTear = eo(seg(tt, 2, 3.2)); s.spurt = win(tt, 2.4, 12, 1); s.bleed = .75 * seg(tt, 3, 12); s.cellDeath = seg(tt, 6, 18); }
  return s;
}
function scene2(ctx, t) {
  const x = seg(t, 5.2, 6.4);
  if (x < 1) {
    bg(ctx, '#151a26', '#06080d');
    const v = 13 * eio(seg(t, .4, 4)), tear = eo(seg(t, 4, 4.6));
    const k = eio(seg(t, 4.4, 6.4)), z = 1 + 2.6 * k;
    ctx.save(); ctx.translate(800, 450); ctx.scale(z, z); ctx.translate(-lerp(800, 690, k), -lerp(450, 470, k));
    const kp = knee(ctx, { x: 800, y: 470, s: .82, t, valgus: v, mclGlow: seg(t, 1.5, 4) * (1 - tear), mclTear: tear, crimp: 1 - seg(t, 1, 3.6) });
    ctx.restore();
    const la = 1 - seg(t, 4.4, 5);
    callout(ctx, 'Valgus load opens the inside of the knee', 1000, 250, null, null, seg(t, .4, 1) * la);
    callout(ctx, 'MCL pulled past its limit', 160, 300, kp.mcl[0], kp.mcl[1], seg(t, 1.8, 2.4) * la, { color: 'rgba(255,110,120,.9)' });
    if (t > 4 && t < 4.5) { ctx.fillStyle = `rgba(255,250,235,${.6 * (1 - seg(t, 4, 4.5))})`; ctx.fillRect(0, 0, W, H); }
  }
  if (x > 0) {
    const tt = t - 6; ctx.save(); ctx.globalAlpha *= x; const s = s2field(tt); drawLigField(ctx, s);
    const r2 = LROWS[2], e2 = lEnds(r2, s);
    callout(ctx, 'Crimp straightens under load', 150, 150, 400, LROWS[1].y, win(tt, -1, 2));
    if (e2) callout(ctx, 'Fibers snap in sequence into frayed "mop" ends', 150, 150, e2.Le + 20, r2.y, win(tt, 2.4, 4.9));
    callout(ctx, 'Bleeding comes from the torn epiligament', 560, 150, LIG.cx + 70, LIG.top[0] + 20, win(tt, 5, 11.6), { color: 'rgba(216,38,60,.9)' });
    const dc = LCELLS.filter(c => Math.abs(c.x - LIG.cx) > 100 && Math.abs(c.x - LIG.cx) < 200)[0];
    if (dc) callout(ctx, 'Cells lose tension and die within hours', 150, 764, dc.x, dc.y, win(tt, 8, 17.4), { color: 'rgba(160,160,160,.95)' });
    if (tt > 6) counter(ctx, 'HOUR ' + Math.max(1, Math.round(1 + 5 * seg(tt, 6, 17))));
    const ia = win(tt, 13.4, 24, .6);
    if (ia > 0) {
      ctx.save(); ctx.globalAlpha *= ia;
      ctx.fillStyle = 'rgba(8,11,18,.94)'; rr(ctx, 1040, 440, 500, 320, 12); ctx.fill();
      const ms = stInjured(tt); ms.bleed = 1; ms.clot = .4; ms.necro = 1; ms.band = 1;
      fieldIn(ctx, ms, 1052, 480, 476, 268, .46, 800, 430);
      ctx.font = `700 15px ${F.mono}`; ctx.fillStyle = '#ef8a9a'; ctx.fillText('MUSCLE, SAME DAY', 1060, 466);
      ctx.restore();
      callout(ctx, 'Bigger bleed + contraction bands', 1500, 790 - 26, 1290, 650, ia, { align: 'right', size: 18 });
      callout(ctx, 'Ligament: no contraction band to seal anything', 150, 764, null, null, seg(tt, 15.6, 16.2), { color: 'rgba(242,184,75,.95)' });
    }
    ctx.restore();
  }
}
function gradingShot(ctx, t) {
  bg(ctx);
  const st = k => {
    const s = LF0(); s.t = t;
    if (k === 0) { s.crimp = 0; s.stretch = .5; s.tension = .4 + .3 * Math.sin(t * 4); s.torn = [2, 3]; }
    if (k === 1) { s.torn = [0, 1, 2]; s.tearP = 2; s.crimp = .3; s.epiTear = .6; s.bleed = .6; }
    if (k === 2) { s.tearP = 2; s.crimp = .3; s.epiTear = 1; s.bleed = .8; s.gapScale = 1.5 + .25 * Math.max(0, Math.sin(t * 2.4)); }
    return s;
  };
  const info = [['GRADE I', 'Stretched fibers'], ['GRADE II', 'Partial tear'], ['GRADE III', 'Complete tear, joint laxity']];
  for (let k = 0; k < 3; k++) {
    const a = seg(t, k * 4, k * 4 + .6); if (a <= 0) continue;
    const x = 60 + k * 500; ctx.save(); ctx.globalAlpha *= a;
    ligFieldIn(ctx, st(k), x, 220, 480, 440, .62);
    ctx.fillStyle = 'rgba(8,11,18,.9)'; rr(ctx, x, 150, 480, 60, 10); ctx.fill();
    ctx.font = `700 30px ${F.display}`; ctx.fillStyle = COL.accent; ctx.fillText(info[k][0], x + 18, 190);
    ctx.font = `500 21px ${F.body}`; ctx.fillStyle = COL.text; ctx.fillText(info[k][1], x + 150, 189);
    if (k === 2) { const p = .5 + .5 * Math.sin(t * 2.4); ctx.fillStyle = `rgba(255,107,118,${.6 + .4 * p})`; for (const d of [-1, 1]) { const ax = x + 240 + d * (150 + 20 * p); ctx.beginPath(); ctx.moveTo(ax + d * 22, 700); ctx.lineTo(ax, 686); ctx.lineTo(ax, 714); ctx.closePath(); ctx.fill(); } bigText(ctx, 'LAXITY', x + 240, 708, 16, 1, { font: F.mono, color: '#ff6b76' }); }
    ctx.restore();
  }
}

/* ---------- Scene 3: inflammation ---------- */
const NEU = Array.from({ length: 70 }, (_, i) => { const r = R(2000 + i); const top = i % 2 === 0; return { sx: LIG.cx + r.r(-160, 160), sy: top ? LIG.top[0] + 18 : LIG.bot[1] - 18, tx: LIG.cx + r.r(-80, 80), ty: r.r(280, 590), t0: r.r(0, 1), seed: r.r(0, 6) }; });
function st3(t) { const s = lInj(t + 40); s.plt = seg(t, 0, 5); s.gf = seg(t, 5, 10); s.clot = seg(t, 9, 18); return s; }
function scene3(ctx, t) {
  const s = st3(t); drawLigField(ctx, s);
  const ga = win(t, 5.2, 14, .8);
  if (ga > 0) {
    const kinds = [['PDGF', '#ffd25a'], ['TGF-β', '#7fe0a0'], ['IGF', '#7fb6ff']];
    const r = R(31);
    kinds.forEach(([lab, c], k) => {
      for (let i = 0; i < 16; i++) { const an = r.r(0, 6.28), sp = r.r(40, 130), f = ((t - 5) * .25 + r.f()) % 1; dot(ctx, LIG.cx + r.r(-50, 50) + Math.cos(an) * sp * f, 436 + r.r(-120, 120) + Math.sin(an) * sp * f, 3.2, c, ga * (1 - f), 10); }
      const lx = 1030, ly = 300 + k * 70; ctx.save(); ctx.globalAlpha *= ga * seg(t, 5.6 + k * .5, 6.2 + k * .5); ctx.fillStyle = 'rgba(8,11,18,.86)'; rr(ctx, lx, ly - 20, 120, 40, 20); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.font = `700 19px ${F.mono}`; ctx.fillStyle = c; ctx.textBaseline = 'middle'; ctx.fillText(lab, lx + 16, ly + 1); ctx.restore();
    });
  }
  for (const n of NEU) {
    const t0 = 12 + n.t0 * 10; const p = eo(seg(t, t0, t0 + 3)); const a = seg(t, t0, t0 + .3); if (a <= 0) continue;
    dot(ctx, lerp(n.sx, n.tx, p) + Math.sin(t * 2 + n.seed) * 4, lerp(n.sy, n.ty, p) + Math.cos(t * 1.7 + n.seed) * 4, 5, LC.neut, a, 6);
  }
  counter(ctx, 'DAY ' + Math.max(1, Math.round(1 + 4 * seg(t, 3, 25))));
  const ka = seg(t, 8, 9);
  if (ka > 0) { ctx.save(); ctx.globalAlpha *= ka; ctx.fillStyle = 'rgba(8,11,18,.9)'; rr(ctx, 1290, 216, 270, 250, 12); ctx.fill(); knee(ctx, { x: 1425, y: 330, s: .26, t, swell: seg(t, 8, 22), mclTear: 1 }); bigText(ctx, 'SWELLING', 1425, 452, 14, 1, { font: F.mono, color: COL.dim }); ctx.restore(); }
  callout(ctx, 'Platelets pile into the clot', 150, 150, LIG.cx - 30, 400, win(t, .5, 5.4), { color: 'rgba(243,201,211,.95)' });
  callout(ctx, 'Platelets burst: growth factors', 150, 150, LIG.cx, 436, win(t, 5.4, 11.6), { color: 'rgba(255,210,90,.95)' });
  callout(ctx, 'Fibrin scaffold spreads between the ends', 150, 764, LIG.cx + 30, 520, win(t, 11.6, 19.6), { color: 'rgba(245,241,232,.9)' });
  callout(ctx, 'Neutrophils flood in, peaking days 1–5', 1060, 764, NEU[4].tx, NEU[4].ty, seg(t, 17.6, 18.2), { color: 'rgba(165,79,224,.95)' });
}

/* ---------- Scene 4: cleanup crew and vessels ---------- */
const MACS = Array.from({ length: 14 }, (_, i) => { const r = R(3000 + i); const top = i % 2 === 0; return { sx: LIG.cx + r.r(-200, 200), sy: top ? LIG.top[0] + 28 : LIG.bot[1] - 28, tx: LIG.cx + r.r(-170, 170), ty: LROWS[i % 6].y + r.r(-14, 14), t0: r.r(0, 4), seed: i }; });
const TC = Array.from({ length: 22 }, (_, i) => { const r = R(3100 + i); return { x: LIG.cx + r.r(-140, 140), y: r.r(280, 590), t0: r.r(3, 8), seed: r.r(0, 6) }; });
function st4(t) { const s = st3(30); s.t = t + 80; s.clot = 1; s.gf = 1; s.deadClear = seg(t, 3, 12); s.vessels = seg(t, 6, 24); s.granul = seg(t, 12, 26); s.granEdge = 1; s.bleed = 1 - .4 * seg(t, 0, 20); return s; }
function scene4(ctx, t) {
  const s = st4(t); drawLigField(ctx, s);
  for (const n of NEU.slice(0, 40)) dot(ctx, n.tx + Math.sin(t * 2 + n.seed) * 4, n.ty + Math.cos(t * 1.7 + n.seed) * 4, 5, LC.neut, 1 - seg(t, 0, 7), 6);
  for (const m of MACS) {
    const p = eo(seg(t, m.t0, m.t0 + 4)), a = seg(t, m.t0, m.t0 + .4); if (a <= 0) continue;
    const mm = eio(seg(t, 9 + m.seed * .3, 11 + m.seed * .3));
    pacRed(ctx, lerp(m.sx, m.tx, p) + Math.sin(t + m.seed) * 3, lerp(m.sy, m.ty, p), 13, t, m.seed, mm, a);
  }
  for (const c of TC) dot(ctx, c.x + Math.sin(t * 1.4 + c.seed) * 6, c.y + Math.cos(t + c.seed) * 5, 4, LC.tcell, seg(t, c.t0, c.t0 + .5), 6);
  ctx.save(); ctx.fillStyle = 'rgba(8,11,18,.88)'; rr(ctx, 1150, 14, 410, 84, 12); ctx.fill();
  ctx.font = `600 17px ${F.mono}`; ctx.fillStyle = '#ef8a9a'; ctx.fillText('MUSCLE   vessels by ~day 3  ✓', 1170, 46);
  ctx.fillStyle = COL.accent; ctx.fillText('LIGAMENT vessels days 5–9', 1170, 80);
  bigText(ctx, 'DAY ' + Math.round(5 + 4 * seg(t, 4, 24)), 1490, 82, 22, 1, { font: F.mono, weight: 700, color: COL.accent }); ctx.restore();
  callout(ctx, 'M1 macrophages eat dead cells and debris', 150, 150, MACS[2].tx, MACS[2].ty, win(t, 1, 9));
  callout(ctx, 'Then switch to M2 repair mode', 150, 150, MACS[5].tx, MACS[5].ty, win(t, 9.2, 14), { color: 'rgba(63,196,111,.95)' });
  callout(ctx, 'T cells', 1060, 764, TC[3].x, TC[3].y, win(t, 5, 10), { color: 'rgba(90,160,255,.95)' });
  const tip = sproutPath(LIG.cx - 62 - 8, -1, 0);
  callout(ctx, 'Capillaries sprout from the epiligament', 1060, 764, tip.p0[0], tip.p0[1] + 20, win(t, 10.2, 16.6), { color: 'rgba(255,51,73,.95)' });
  callout(ctx, 'Granulation tissue moves in from the sheath', 150, 764, LIG.cx, 600, seg(t, 16.8, 17.4), { color: 'rgba(185,106,118,.95)' });
}

/* ---------- Scene 5: granulation and type III ---------- */
const FIBS = Array.from({ length: 30 }, (_, i) => {
  const r = R(4000 + i); const src = i % 3; let sx, sy;
  if (src === 0) { sx = LIG.cx + r.r(-120, 120); sy = i % 2 ? LIG.top[0] + 24 : LIG.bot[1] - 24; }
  else if (src === 1) { const row = LROWS[i % 6]; sx = LIG.cx + (i % 2 ? -1 : 1) * 180; sy = row.y; }
  else { sx = LIG.cx + r.r(-60, 60); sy = 436 + (i % 2 ? -1 : 1) * 120; }
  return { sx, sy, tx: LIG.cx + r.r(-75, 75), ty: r.r(285, 590), an: r.r(-1.3, 1.3), t0: r.r(0, 6), seed: r.r(0, 6), die: i % 3 !== 1 ? 22 + r.r(0, 7) : 99 };
});
function st5(t) { const s = st4(30); s.t = t + 120; s.granul = 1; s.granEdge = 0; s.vessels = 1; s.deadClear = 1; s.col3 = seg(t, 3, 16); s.col1End = seg(t, 11, 20); s.bleed = .5; return s; }
function drawFibs(ctx, t, o = {}) {
  for (const f of FIBS) {
    const p = eio(seg(t, f.t0, f.t0 + 4)), a = seg(t, f.t0, f.t0 + .4); if (a <= 0) continue;
    const dieT = o.noDie ? 99 : f.die; const shrink = seg(t, dieT, dieT + .7); if (t > dieT + 1.1) continue;
    const x = lerp(f.sx, f.tx, p) + Math.sin(t * .5 + f.seed) * 4, y = lerp(f.sy, f.ty, p) + Math.cos(t * .4 + f.seed) * 4;
    if (shrink < 1) fibroCell(ctx, x, y, lerp(0, f.an, p), lerp(20, 7, shrink), a * (1 - .4 * shrink), { color: LC.fib, actin: o.actin || 0 });
    else ring(ctx, x, y, 6 + 26 * seg(t, dieT + .7, dieT + 1.1), '#ffd2a0', 1 - seg(t, dieT + .7, dieT + 1.1), 2);
  }
}
function scene5(ctx, t) {
  const s = st5(t); drawLigField(ctx, s); drawFibs(ctx, t);
  counter(ctx, 'WEEKS 1–4');
  callout(ctx, 'Fibroblasts swarm in: sheath, torn ends, blood', 150, 150, FIBS[4].tx, FIBS[4].ty, win(t, .6, 8.6), { color: 'rgba(240,138,48,.95)' });
  callout(ctx, 'Type III collagen: thin, random, fills the gap solid', 150, 764, LIG.cx, 470, win(t, 5, 13.6), { color: 'rgba(247,229,140,.95)' });
  const e = lEnds(LROWS[2], s);
  if (e) callout(ctx, 'Type I starts at the old ends', 1060, 150, e.Re + 20, LROWS[2].y, win(t, 12, 22.4), { color: 'rgba(226,165,35,.95)' });
  callout(ctx, 'From day 9: extra cells die off (apoptosis)', 1060, 764, FIBS[0].tx, FIBS[0].ty, seg(t, 22.4, 23));
}
function splitMuscleLig(ctx, t) {
  bg(ctx);
  const m = stInjured(t); m.bleed = 1; m.clot = 1; m.necro = 1; m.band = 1; m.cleared = 1; m.granul = .8; m.vessels = 1; m.col3 = .5; m.satGlow = 1; m.myo = lerp(.05, .95, eio(seg(t, 0, 8)));
  fieldIn(ctx, m, 30, 140, 760, 610, .92, 800, 430);
  ligFieldIn(ctx, st5(26), 810, 140, 760, 610, .95, 800, 436, c => drawFibs(c, 20, { noDie: true }));
  panelLabel(ctx, 50, 170, 'MUSCLE: FIBERS REGROW IN TUNNELS', '#ef8a9a'); panelLabel(ctx, 830, 170, 'LIGAMENT: ONLY THREAD', LC.col3);
}

/* ---------- Scene 6: proliferation ---------- */
function st6(t) {
  const s = st5(30); s.t = t + 160; s.col1End = 1; s.col1 = lerp(.25, 1, seg(t, 0, 20)); s.col3 = 1 - .75 * seg(t, 4, 22);
  const n = Math.floor(t / 2.2), fr = seg(t % 2.2, 0, .6); s.align = clamp((n + eo(fr)) / 10); s.contract = seg(t, 10, 20); s.vessels = 1; return s;
}
function calAt(t, list) { let c = list[0][0]; for (const [n, s] of list) if (t >= s) c = n; return c; }
function scene6(ctx, t) {
  const s = st6(t); drawLigField(ctx, s);
  const pulse = 1 - seg(t % 2.2, 0, .8);
  ctx.save(); ctx.fillStyle = `rgba(242,184,75,${.35 + .65 * pulse})`;
  for (const [x, d] of [[470, -1], [1130, 1]]) for (const y of [330, 436, 542]) { ctx.beginPath(); ctx.moveTo(x + d * (28 + 10 * pulse), y); ctx.lineTo(x + d * 4, y - 15); ctx.lineTo(x + d * 4, y + 15); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  if (t > 10) for (let k = 0; k < 6; k++) { const tug = Math.sin(t * 2.2 + k) * 2; fibroCell(ctx, LIG.cx + (k % 2 ? 26 : -26) + tug, 300 + k * 52, k % 2 ? .1 : -.1, 18, seg(t, 10, 11.5), { color: LC.fib, actin: 1 }); }
  counter(ctx, calAt(t, [['WEEK 6', 0], ['WEEK 10', 5], ['MONTH 3', 10], ['MONTH 4', 15], ['MONTH 6', 20]]));
  const ra = seg(t, 14, 15);
  if (ra > 0) {
    ctx.save(); ctx.globalAlpha *= ra; ctx.fillStyle = 'rgba(8,11,18,.92)'; rr(ctx, 1250, 470, 310, 250, 12); ctx.fill(); ctx.strokeStyle = 'rgba(242,184,75,.5)'; ctx.stroke();
    ctx.beginPath(); rr(ctx, 1250, 470, 310, 250, 12); ctx.clip();
    const rc = runCycle(t * 2 * Math.PI * 1.2); drawRunner(ctx, { x: 1385, y: 560 + rc.bob * .3, s: .27, ...rc, lean: 16, ham: 0 });
    ctx.restore();
    bigText(ctx, 'BACK RUNNING: WEEK 2–4', 1405, 706, 15, ra, { font: F.mono, weight: 600, color: COL.accent });
  }
  callout(ctx, 'Each load cycle combs the collagen straighter', 150, 150, LIG.cx - 40, 400, win(t, 2, 10.6), { color: 'rgba(242,184,75,.95)' });
  callout(ctx, 'Gold type I ropes replace yellow type III', 150, 764, LIG.cx + 20, 500, win(t, 6, 12.4), { color: 'rgba(226,165,35,.95)' });
  callout(ctx, 'Myofibroblasts winch the scar tighter', 1060, 150, LIG.cx + 26, 352, win(t, 12, 18), { color: 'rgba(240,138,48,.95)' });
}
function rtsShot(ctx, t) {
  bg(ctx);
  const X0 = 160, X1 = 1380, wk = w => X0 + (X1 - X0) * w / 26;
  bigText(ctx, 'ANKLE SPRAIN: RETURN TO SPORT vs SCAR MATURITY', 800, 160, 34, seg(t, 0, .6));
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X0, 600); ctx.lineTo(X1 + 120, 600); ctx.stroke();
  ctx.fillStyle = COL.dim; ctx.font = `500 16px ${F.mono}`; ctx.textAlign = 'center';
  [[0, 'Wk 0'], [4, 'Wk 4'], [8, 'Wk 8'], [13, 'Mo 3'], [26, 'Mo 6']].forEach(([w, l]) => { ctx.fillText(l, wk(w), 630); ctx.fillRect(wk(w) - 1, 594, 2, 12); });
  ctx.fillText('→ 12+ mo', X1 + 90, 630); ctx.textAlign = 'left';
  [['GRADE I', 1, 1], ['GRADE II', 2, 3], ['GRADE III', 4, 5]].forEach(([g, w, at], i) => {
    const a = seg(t, at, at + .6); if (a <= 0) return;
    const y = 250 + i * 70; ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(63,208,176,.25)'; rr(ctx, X0, y - 16, wk(w) - X0, 32, 8); ctx.fill();
    ctx.fillStyle = COL.HUMAN; ctx.beginPath(); ctx.arc(wk(w), y, 9, 0, 7); ctx.fill();
    ctx.font = `700 20px ${F.mono}`; ctx.fillStyle = COL.text; ctx.fillText(g, X0 - 140, y + 7);
    ctx.font = `600 20px ${F.body}`; ctx.fillStyle = COL.HUMAN; ctx.fillText(`back to sport ~${w} wk`, wk(w) + 18, y + 7); ctx.restore();
  });
  const ba = seg(t, 7, 10);
  if (ba > 0) {
    const y = 500; const g = ctx.createLinearGradient(X0, 0, X1 + 120, 0); g.addColorStop(0, LC.col3); g.addColorStop(.7, LC.col1); g.addColorStop(1, rgba(LC.col1, .2));
    ctx.save(); ctx.fillStyle = g; rr(ctx, X0, y - 20, (X1 + 120 - X0) * ba, 40, 10); ctx.fill();
    ctx.font = `600 20px ${F.body}`; ctx.fillStyle = '#1a1406'; ctx.fillText('Scar maturing: proliferation to ~6 months, remodeling 6–12+ months', X0 + 16, y + 7); ctx.restore();
  }
  const ma = seg(t, 10, 11);
  if (ma > 0) {
    ctx.save(); ctx.globalAlpha *= ma; ctx.strokeStyle = '#ff6b76'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(wk(4), 430); ctx.lineTo(wk(4), 470); ctx.moveTo(wk(4), 450); ctx.lineTo(X1 + 100, 450); ctx.moveTo(X1 + 100, 430); ctx.lineTo(X1 + 100, 470); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `700 20px ${F.mono}`; ctx.fillStyle = '#ff6b76'; ctx.fillText('THE MISMATCH', wk(9), 435); ctx.restore();
  }
}

/* ---------- Scene 7: remodeling ---------- */
function st7(t) { const s = st6(26); s.t = t + 200; s.col3 = lerp(.25, .15, seg(t, 0, 16)); s.col1 = 1; s.align = 1; s.braid = seg(t, 0, 8); s.retract = seg(t, 3, 12); s.contract = lerp(1, 1.4, seg(t, 4, 14)); s.healed = .6 * seg(t, 6, 16); s.scarRecept = .35; return s; }
function scene7(ctx, t) {
  const s = st7(t); drawLigField(ctx, s);
  counter(ctx, calAt(t, [['MONTH 6', 0], ['MONTH 9', 5], ['MONTH 12', 10], ['YEARS', 14]]));
  callout(ctx, 'Cross-links: rungs between the ropes', 150, 150, LIG.cx, 420, win(t, .5, 6.4), { color: 'rgba(226,165,35,.95)' });
  callout(ctx, 'Capillaries retract and fade', 1060, 764, LIG.cx + 40, 560, win(t, 4, 10.4), { color: 'rgba(255,51,73,.9)' });
  callout(ctx, 'Scar shrinks slightly and densifies', 150, 764, LIG.cx, 600, seg(t, 10, 10.6));
}
function ligPanel(ctx, x, y, w, healed, t) {
  const L = healed ? w * .96 : w * .88; const x0 = x + (w - L) / 2; const cx = x + w / 2;
  for (let k = 0; k < 6; k++) {
    const yy = y + 60 + k * 50;
    if (!healed) bundle(ctx, x0, x0 + L, yy, 42, 1, { ph: k });
    else {
      bundle(ctx, x0, cx - 70, yy, 42, .6, { ph: k }); bundle(ctx, cx + 70, x0 + L, yy, 42, .6, { ph: k + 1 });
      bundle(ctx, cx - 72, cx + 72, yy, 30, .1, { color: LC.scar, line: 'rgba(160,120,60,.4)' });
    }
  }
  if (healed) {
    const r = R(5); ctx.save(); ctx.lineWidth = 1.4;
    for (let i = 0; i < 26; i++) { const xx = cx + r.r(-64, 64), yy = y + r.r(40, 340), an = r.r(-.8, .8), l = r.r(16, 40); ctx.strokeStyle = r.f() < .45 ? LC.col3 : 'rgba(200,150,60,.8)'; ctx.beginPath(); ctx.moveTo(xx - Math.cos(an) * l / 2, yy - Math.sin(an) * l / 2); ctx.quadraticCurveTo(xx + 6, yy - 6, xx + Math.cos(an) * l / 2, yy + Math.sin(an) * l / 2); ctx.stroke(); }
    ctx.restore();
  }
  const rec = healed ? [[x0 + 60, 1], [cx - 30, .3], [cx + 40, .25], [x0 + L - 60, 1]] : [[x0 + 60, 1], [cx - 60, 1], [cx + 30, 1], [cx + 120, 1], [x0 + L - 60, 1]];
  rec.forEach(([rx, b], i) => receptor(ctx, rx, y + 110 + (i % 3) * 100, (.3 + .7 * Math.max(0, Math.sin(t * 2.6 + i))) * b, .5 + .5 * b));
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y + 380); ctx.lineTo(x0 + L, y + 380); ctx.moveTo(x0, y + 370); ctx.lineTo(x0, y + 390); ctx.moveTo(x0 + L, y + 370); ctx.lineTo(x0 + L, y + 390); ctx.stroke();
}
function compareShot(ctx, t) {
  bg(ctx);
  ligPanel(ctx, 60, 150, 700, false, t); ligPanel(ctx, 840, 150, 700, true, t);
  panelLabel(ctx, 70, 160, 'NORMAL LIGAMENT', LC.coll); panelLabel(ctx, 850, 160, 'HEALED: SCAR', LC.col1);
  bigText(ctx, 'length', 410, 562, 15, 1, { font: F.mono, color: COL.dim }); bigText(ctx, 'slightly longer', 1190, 562, 15, seg(t, 15.5, 16.2), { font: F.mono, color: '#ff9aa4' });
  const sa = seg(t, 9, 10);
  if (sa > 0) {
    ctx.save(); ctx.globalAlpha *= sa; ctx.fillStyle = 'rgba(8,11,18,.9)'; rr(ctx, 560, 600, 480, 150, 12); ctx.fill();
    ctx.font = `600 17px ${F.mono}`; ctx.fillStyle = COL.dim; ctx.fillText('TENSILE STRENGTH (TENDON DATA)', 580, 630);
    const bar = (y, f, c, l) => { ctx.fillStyle = 'rgba(255,255,255,.1)'; rr(ctx, 700, y, 300, 20, 6); ctx.fill(); ctx.fillStyle = c; rr(ctx, 700, y, 300 * f, 20, 6); ctx.fill(); ctx.fillStyle = COL.text; ctx.font = `500 17px ${F.body}`; ctx.fillText(l, 580, y + 16); };
    bar(650, 1, LC.coll, 'Normal'); bar(690, lerp(1, .7, eio(seg(t, 10, 12))), LC.col1, 'Repaired');
    bigText(ctx, 'up to 30% lower', 1000, 738, 15, seg(t, 11.6, 12.2), { font: F.mono, color: '#ff9aa4', align: 'right' });
    ctx.restore();
  }
  callout(ctx, 'More type III, thinner, less organized fibrils', 1060, 108, 1190, 300, win(t, .6, 16));
  callout(ctx, 'Fewer, dimmer position sensors', 1060, 108, 1160, 360, seg(t, 17, 17.6), { color: 'rgba(244,214,60,.95)' });
}

/* ---------- Scene 8: why the ACL is different ---------- */
function vLig(ctx, cx, yTop, yBot, gap, t, o = {}) {
  const mid = (yTop + yBot) / 2; ctx.save(); ctx.translate(cx, mid); ctx.rotate(Math.PI / 2);
  const up = mid - yTop, dn = yBot - mid, lo = -(o.dx || 0), w = o.wob || 0;
  for (let k = 0; k < 3; k++) {
    const ly = (k - 1) * 23; const fl = w * Math.sin(t * 1.3 + k) * 6;
    bundle(ctx, -up, -gap / 2 + fl, ly, 21, o.crimp ?? .4, { r: 10 }); mop(ctx, -gap / 2 + fl, ly, 21, 1, o.fray ?? 1, 700 + k, t);
    bundle(ctx, gap / 2 - fl, dn, ly + lo, 21, o.crimp ?? .4, { r: 10 }); mop(ctx, gap / 2 - fl, ly + lo, 21, -1, o.fray ?? 1, 710 + k, t);
  }
  ctx.restore();
}
function boneBlock(ctx, x, y, w, h, top) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, LC.boneLo); g.addColorStop(.5, LC.bone); g.addColorStop(1, LC.boneLo);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, h, top ? [6, 6, 40, 40] : [40, 40, 6, 6]); ctx.fill(); ctx.strokeStyle = 'rgba(80,70,50,.7)'; ctx.lineWidth = 2; ctx.stroke();
}
function mclPanel(ctx, tt, cx = 420) {
  ctx.save(); ctx.fillStyle = 'rgba(180,90,100,.10)'; rr(ctx, cx - 340, 140, 680, 610, 14); ctx.fill(); ctx.restore();
  const yT = 280, yB = 600, mid = 440, gap = lerp(10, 46, eo(seg(tt, 0, 1)));
  boneBlock(ctx, cx - 150, 160, 300, 120, true); boneBlock(ctx, cx - 150, 600, 300, 130, false);
  const ca = seg(tt, 1.5, 4); const heal = seg(tt, 12, 22);
  vLig(ctx, cx, yT, yB, gap, tt, { fray: 1 - .7 * heal });
  if (ca > 0) {
    ctx.save(); ctx.globalAlpha *= ca; ctx.fillStyle = mixHex(mixHex(LC.blood, LC.gran, seg(tt, 6, 12)), LC.scar, heal);
    rr(ctx, cx - 44, mid - gap / 2 - 10, 88, gap + 20, 12); ctx.fill();
    if (heal > 0) { ctx.strokeStyle = LC.col3; ctx.lineWidth = 1.4; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(cx - 36 + k * 9, mid - gap / 2 - 6); ctx.quadraticCurveTo(cx - 30 + k * 9, mid, cx - 36 + k * 9 + 4, mid + gap / 2 + 6); ctx.globalAlpha = ca * heal; ctx.stroke(); } }
    ctx.restore();
  }
}
function aclPanel(ctx, tt, cx = 1180, o = {}) {
  ctx.save(); ctx.fillStyle = 'rgba(241,207,92,.16)'; rr(ctx, cx - 340, 140, 680, 610, 14); ctx.fill(); ctx.clip();
  const r = R(66);
  for (let i = 0; i < 80; i++) { const y = r.r(150, 740), sp = r.r(50, 90), x = cx - 340 + ((r.r(0, 680) + tt * sp) % 680); ctx.fillStyle = `rgba(250,226,140,${r.r(.25, .6)})`; ctx.beginPath(); ctx.arc(x, y + Math.sin(tt * 2 + i) * 6, 2.4, 0, 7); ctx.fill(); }
  ctx.restore();
  const step = o.noStep ? 0 : 30 * Math.max(0, Math.sin((tt - 8) * 1.4)) * seg(tt, 8, 10);
  const gap = o.gap ?? (lerp(10, 46, eo(seg(tt, 0, 1))) + 60 * seg(tt, 6, 24));
  boneBlock(ctx, cx - 150, 160, 300, 120, true); boneBlock(ctx, cx - 150 + step, 600, 300, 130, false);
  vLig(ctx, cx, 280, 600, gap, tt, { dx: step, wob: o.wob ?? 1, fray: o.fray ?? 1 });
  if (!o.noClots) for (let k = 0; k < 8; k++) {
    const u = tt - (1.5 + k * 3.2); if (u < 0 || u > 3.2) continue;
    const rad = 22 * eo(seg(u, 0, .8)), dx = Math.max(0, u - .8) * 110, a = 1 - seg(u, 1.2, 3);
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#8c1626'; blob(ctx, cx + dx, 440 + Math.sin(u * 2) * 10, rad, u, k, .2); ctx.fill(); ctx.restore();
  }
  if (step > 2) { ctx.save(); ctx.fillStyle = '#ff6b76'; ctx.beginPath(); ctx.moveTo(cx + 170 + step, 665); ctx.lineTo(cx + 150 + step, 650); ctx.lineTo(cx + 150 + step, 680); ctx.fill(); ctx.restore(); }
  return step;
}
function scene8(ctx, t) {
  const x = seg(t, 6.4, 7.4);
  if (x < 1) {
    bg(ctx, '#151a26', '#06080d');
    const tear = eo(seg(t, 3.6, 4.2));
    const kp = knee(ctx, { x: 800, y: 470, s: .86, t, syn: 1, mclTear: tear, aclTear: tear, aclGlow: .3 * (1 - tear), mclGlow: .3 * (1 - tear) });
    callout(ctx, 'MCL: outside the joint', 150, 300, kp.mcl[0], kp.mcl[1], win(t, .4, 6.6));
    callout(ctx, 'ACL: inside, bathed in synovial fluid', 1060, 300, kp.acl[0], kp.acl[1], win(t, 1.2, 6.6), { color: 'rgba(241,207,92,.95)' });
    if (t > 3.6 && t < 4.1) { ctx.fillStyle = `rgba(255,250,235,${.6 * (1 - seg(t, 3.6, 4.1))})`; ctx.fillRect(0, 0, W, H); }
  }
  if (x > 0) {
    const tt = t - 7; ctx.save(); ctx.globalAlpha *= x; bg(ctx);
    mclPanel(ctx, tt); const step = aclPanel(ctx, tt);
    panelLabel(ctx, 100, 172, 'MCL', LC.coll); panelLabel(ctx, 860, 172, 'ACL', LC.syn);
    callout(ctx, 'Clot sets and bridges the gap', 120, 764, 420, 440, win(tt, 1.6, 14), { color: 'rgba(216,38,60,.9)' });
    callout(ctx, 'Becomes scar: heals on its own', 120, 764, 420, 440, seg(tt, 14, 14.6), { color: 'rgba(230,210,156,.95)' });
    callout(ctx, 'Synovial fluid washes the clot away', 1500, 764, 1240, 440, win(tt, 1.6, 9.6), { align: 'right', color: 'rgba(241,207,92,.95)' });
    callout(ctx, 'Each step: tibia slides forward, ends pull apart', 1500, 764, 1330 + step, 665, seg(tt, 9.6, 10.2), { align: 'right', color: 'rgba(255,107,118,.95)' });
    ctx.restore();
  }
}
function bearShot(ctx, t) {
  bg(ctx);
  const gap = lerp(110, 70, eio(seg(t, 6, 10)));
  aclPanel(ctx, t + 30, 800, { noStep: true, noClots: true, gap, wob: 1 - seg(t, 6, 10), fray: lerp(1, 1.5, seg(t, 6, 10)) });
  const sx = lerp(1300, 800, eo(seg(t, .3, 2.5))), sh = 120;
  ctx.save(); ctx.fillStyle = '#e8d8b8'; rr(ctx, sx - 60, 440 - sh / 2, 120, sh, 14); ctx.fill(); ctx.clip();
  const soak = seg(t, 3, 6.5); ctx.fillStyle = 'rgba(150,20,35,.8)'; ctx.fillRect(sx - 60, 440 + sh / 2 - sh * soak, 120, sh * soak);
  ctx.fillStyle = 'rgba(80,60,40,.35)'; for (let i = 0; i < 7; i++) for (let j = 0; j < 6; j++) { ctx.beginPath(); ctx.arc(sx - 50 + i * 17 + (j % 2) * 8, 440 - sh / 2 + 10 + j * 20, 4, 0, 7); ctx.fill(); }
  ctx.restore();
  panelLabel(ctx, 480, 172, 'BRIDGE-ENHANCED ACL REPAIR (BEAR)', LC.syn);
  callout(ctx, 'Scaffold placed in the gap', 1200, 300, sx + 50, 400, win(t, 1, 5));
  callout(ctx, 'Soaked in the patient\'s own blood', 1200, 300, sx + 40, 470, win(t, 4, 8.4), { color: 'rgba(216,38,60,.9)' });
  callout(ctx, 'The clot has something to hold onto', 1200, 300, 820, 420, seg(t, 8.4, 9), { color: 'rgba(63,196,111,.95)' });
}

/* ---------- Scene 9: how treatments act ---------- */
const TREAT = [
  { t: 2, x: 250, span: [0, 10], title: 'Brief protection', sub: 'Days 0–10 for Grade III', tag: null, icon: 'brace' },
  { t: 9, x: 860, span: [14, 150], title: 'Early protected loading', tag: 'HUMAN', icon: 'load' },
  { t: 16, x: 1380, span: [180, 365], title: 'Balance / proprioception', tag: 'HUMAN', icon: 'sensor' },
  { t: 23, x: 340, span: [0, 9], title: 'NSAIDs', tag: 'MIXED/ANIMAL', icon: 'dimmer' },
  { t: 30, x: 430, span: [0, 9], title: 'Acetaminophen', tag: 'ANIMAL', note: 'extrapolated from muscle', icon: 'brain' },
  { t: 37, x: 560, span: [5, 28], title: 'Shockwave and PRP', tag: 'ANIMAL/LIMITED HUMAN', icon: 'spark' },
  { t: 44, x: 1200, span: [42, 365], title: 'Manual therapy and movement', tag: 'MODEL/THEORY', icon: 'hand' }
];
function treatIcon(ctx, kind, x, y, a, t) {
  if (a <= .01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
  ctx.fillStyle = 'rgba(8,11,18,.92)'; ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fill(); ctx.strokeStyle = COL.accent; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = COL.text; ctx.fillStyle = COL.text; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  if (kind === 'brace') { rr(ctx, -12, -13, 7, 26, 3); ctx.fill(); rr(ctx, 5, -13, 7, 26, 3); ctx.fill(); ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(12, -6); ctx.moveTo(-12, 6); ctx.lineTo(12, 6); ctx.stroke(); }
  if (kind === 'load') { for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 4, 0); ctx.lineTo(d * 14, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(d * 16, 0); ctx.lineTo(d * 10, -5); ctx.lineTo(d * 10, 5); ctx.fill(); } }
  if (kind === 'sensor') { ctx.strokeStyle = COL.nerve; ellipse(ctx, 0, 0, 12, 7); ctx.stroke(); ellipse(ctx, 0, 0, 5, 3); ctx.stroke(); }
  if (kind === 'dimmer' || kind === 'brain') { if (kind === 'brain') { ctx.fillStyle = '#d98fa2'; for (const [dx, dy] of [[-5, -3], [4, -5], [6, 3], [-3, 5]]) { ctx.beginPath(); ctx.arc(dx, dy, 6, 0, 7); ctx.fill(); } } else { ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(-4, 0, 5, 0, 7); ctx.fill(); } }
  if (kind === 'spark') { ctx.fillStyle = '#ffd25a'; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(3, 0); ctx.lineTo(0, 13); ctx.lineTo(-3, 0); ctx.fill(); } }
  if (kind === 'hand') { ctx.fillStyle = '#e9d6c7'; rr(ctx, -12, -2, 24, 12, 5); ctx.fill(); for (let k = 0; k < 4; k++) { rr(ctx, -11 + k * 6, -12, 5, 12, 2); ctx.fill(); } }
  ctx.restore();
}
function treatField(i, u, t) {
  let s;
  if (i === 0) { s = st3(20); s.t = t; }
  else if (i === 1) { s = st5(30); s.t = t; s.col1 = .3; s.align = seg(u, 1, 6); }
  else if (i === 2) { s = st7(16); s.t = t; s.scarRecept = .15 + .85 * seg(u, 1, 5); }
  else if (i === 3 || i === 4) { s = st3(20); s.t = t; }
  else if (i === 5) { s = st4(18); s.t = t; s.vessels = lerp(.5, 1, seg(u, 1, 5)); }
  else { s = st7(16); s.t = t; s.epiShift = 60 * Math.sin(u * 1.8); s.retract = 1; }
  return s;
}
function treatOver(ctx, i, u, t) {
  if (i === 0) { const a = seg(u, .5, 1.5); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(200,215,235,.85)'; for (const x of [540, 1040]) { rr(ctx, x, 230, 26, 420, 12); ctx.fill(); } ctx.fillStyle = 'rgba(200,215,235,.4)'; for (const y of [270, 600]) ctx.fillRect(540, y, 526, 20); ctx.restore(); }
  if (i === 1) { const p = 1 - seg(u % 1.6, 0, .8); ctx.fillStyle = `rgba(242,184,75,${.4 + .6 * p})`; for (const [x, d] of [[480, -1], [1120, 1]]) for (const y of [340, 436, 532]) { ctx.beginPath(); ctx.moveTo(x + d * 30, y); ctx.lineTo(x, y - 16); ctx.lineTo(x, y + 16); ctx.closePath(); ctx.fill(); } }
  if (i === 3 || i === 4) {
    const dim = i === 3 ? seg(u, 1.5, 4) : 0; const r = R(12);
    for (let k = 0; k < 40; k++) { const an = r.r(0, 6.28), f = (t * .4 + r.f()) % 1; dot(ctx, LIG.cx + Math.cos(an) * (20 + f * 220), 436 + Math.sin(an) * (20 + f * 160), 3, '#ff7ab8', (1 - f) * (1 - .8 * dim), 8); }
    for (let k = 0; k < 6; k++) pacRed(ctx, LIG.cx - 70 + (k % 3) * 70, 360 + Math.floor(k / 3) * 150, 14, t, k, 0, 1 - .65 * dim);
    const kx = 1250, ky = 300; ctx.save(); ctx.fillStyle = 'rgba(8,11,18,.9)'; rr(ctx, kx - 90, ky - 60, 260, 130, 12); ctx.fill();
    if (i === 4) { ctx.fillStyle = '#d98fa2'; for (const [dx, dy, r2] of [[-30, -6, 20], [-4, -16, 20], [14, 0, 17], [-14, 10, 18]]) { ctx.beginPath(); ctx.arc(kx + dx - 20, ky + dy, r2, 0, 7); ctx.fill(); } }
    const kd = i === 3 ? dim : seg(u, 1.5, 4); const sx = i === 3 ? kx - 70 : kx + 30, sw = i === 3 ? 220 : 110;
    ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(ctx, sx, ky + 34, sw, 10, 5); ctx.fill(); ctx.fillStyle = COL.accent; rr(ctx, sx, ky + 34, sw * (1 - .7 * kd), 10, 5); ctx.fill();
    ctx.font = `600 14px ${F.mono}`; ctx.fillStyle = COL.dim; ctx.fillText(i === 3 ? 'INJURY-SITE SIGNALS' : 'PAIN (BRAIN)', sx, ky + 62); ctx.restore();
  }
  if (i === 5) { for (let k = 0; k < 3; k++) { const f = (t * 1.1 + k / 3) % 1; ctx.strokeStyle = `rgba(160,220,255,${(1 - f) * .7})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(800, 180, 30 + f * 500, 15 + f * 300, 0, .05 * Math.PI, .95 * Math.PI); ctx.stroke(); } const r = R(9); for (let k = 0; k < 40; k++) { const tw = Math.max(0, Math.sin(t * 4 + k)); dot(ctx, LIG.cx + r.r(-110, 110), r.r(270, 600), 2 + 2 * tw, k % 2 ? '#ffd25a' : '#7fe0a0', .4 + .6 * tw, 10); } }
  if (i === 6) { const hx = 700 + 60 * Math.sin(u * 1.8); ctx.save(); ctx.fillStyle = '#e9d6c7'; ctx.strokeStyle = '#8b6f5e'; ctx.lineWidth = 2; rr(ctx, hx - 80, 228, 160, 40, 18); ctx.fill(); ctx.stroke(); for (let k = 0; k < 4; k++) { rr(ctx, hx - 72 + k * 38, 190, 30, 50, 14); ctx.fill(); ctx.stroke(); } ctx.fillStyle = COL.accent; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + d * 130, 248); ctx.lineTo(hx + d * 104, 234); ctx.lineTo(hx + d * 104, 262); ctx.closePath(); ctx.fill(); } ctx.restore(); }
}
function treatShot(ctx, t) {
  bg(ctx);
  const ph = [[0, 5, LC.blood, 'Inflammation'], [5, 9, '#c0563f', 'Cleanup + vessels'], [9, 28, LC.gran, 'Granulation'], [28, 180, LC.col3, 'Proliferation'], [180, 365, LC.col1, 'Remodeling']];
  ph.forEach(([a, b, c, l]) => { ctx.fillStyle = c; rr(ctx, dayX(a) + 1, 214, dayX(b) - dayX(a) - 2, 16, 4); ctx.fill(); ctx.font = `600 14px ${F.mono}`; ctx.fillStyle = COL.dim; ctx.textAlign = 'center'; ctx.fillText(l.toUpperCase(), (dayX(a) + dayX(b)) / 2, 252); ctx.textAlign = 'left'; });
  ctx.font = `500 13px ${F.mono}`; ctx.fillStyle = COL.dim; [[0, 'D0'], [9, 'D9'], [28, 'WK4'], [180, 'MO6'], [365, 'MO12']].forEach(([d, l]) => ctx.fillText(l, dayX(d) - 10, 206));
  let cur = -1; TREAT.forEach((it, i) => { if (t >= it.t) cur = i; });
  TREAT.forEach((it, i) => {
    const a = seg(t, it.t, it.t + .5); if (a <= 0) return;
    const act = i === cur;
    ctx.save(); ctx.globalAlpha *= a * (act ? 1 : .55); ctx.strokeStyle = act ? COL.accent : 'rgba(255,255,255,.3)'; ctx.lineWidth = act ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(dayX(it.span[0]), 236); ctx.lineTo(dayX(it.span[1]), 236); ctx.stroke(); ctx.beginPath(); ctx.moveTo(it.x, 158); ctx.lineTo(it.x, 214); ctx.stroke(); ctx.restore();
    treatIcon(ctx, it.icon, it.x, 140, a * (act ? 1 : .6), t);
  });
  if (cur >= 0) {
    const it = TREAT[cur], u = t - it.t, nxt = cur + 1 < TREAT.length ? TREAT[cur + 1].t : 52;
    const a = seg(u, 0, .5) * (1 - seg(t, nxt - .4, nxt));
    ctx.save(); ctx.globalAlpha *= a;
    ligFieldIn(ctx, treatField(cur, u, t), 200, 290, 1200, 460, .86, 800, 436, c => treatOver(c, cur, u, t));
    ctx.fillStyle = 'rgba(8,11,18,.9)'; rr(ctx, 216, 304, 560, 50, 10); ctx.fill();
    ctx.font = `700 28px ${F.display}`; ctx.fillStyle = COL.text; ctx.fillText(it.title.toUpperCase(), 234, 340);
    if (it.tag) { ctx.font = `700 28px ${F.display}`; const w = ctx.measureText(it.title.toUpperCase()).width; tagPill(ctx, it.tag, 250 + w, 330, 1, 13); }
    if (it.note || it.sub) { ctx.font = `500 15px ${F.mono}`; ctx.fillStyle = COL.dim; ctx.fillText(it.note || it.sub, 234, 376); }
    ctx.restore();
  }
}

/* ---------- Scene 10: side-by-side summary ---------- */
function syncShot(ctx, t) {
  bg(ctx);
  const u = eio(seg(t, 1, 16)), x = 120 + u * 1360, day = xDay(x);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; rr(ctx, 120, 140, 1360, 10, 5); ctx.fill(); ctx.fillStyle = COL.accent; rr(ctx, 120, 140, x - 120, 10, 5); ctx.fill();
  ctx.beginPath(); ctx.arc(x, 145, 10, 0, 7); ctx.fill();
  const lab = day < 1 ? 'DAY 0' : day < 28 ? 'DAY ' + Math.round(day) : day < 180 ? 'WEEK ' + Math.round(day / 7) : 'MONTH ' + Math.round(day / 30.4);
  bigText(ctx, lab, Math.min(1440, Math.max(160, x)), 186, 20, 1, { font: F.mono, weight: 700, color: COL.accent });
  fieldIn(ctx, muscleAt(day, t), 30, 210, 760, 540, .88, 800, 430);
  ligFieldIn(ctx, ligAt(day, t), 810, 210, 760, 540, .93);
  const ms = day < 1 ? 'Bleed + contraction bands' : day < 4 ? 'Cleanup' : day < 10 ? 'Satellite cells → myotubes' : day < 28 ? 'Fibers pierce the scar' : 'Muscle + thin seam';
  const ls = day < 5 ? 'Clot + neutrophils' : day < 9 ? 'Macrophages + vessels' : day < 28 ? 'Type III fills the gap' : day < 180 ? 'Aligning, type I' : 'All scar, still maturing';
  panelLabel(ctx, 50, 240, 'MUSCLE · ' + ms.toUpperCase(), '#ef8a9a'); panelLabel(ctx, 830, 240, 'LIGAMENT · ' + ls.toUpperCase(), LC.coll);
}
const TABLE = [
  ['Healing type', 'Regeneration plus repair', 'Repair only (scar)'],
  ['Rebuilders', 'Satellite cells', 'Fibroblasts from ends, epiligament, blood'],
  ['Blood supply', 'Rich', 'Poor'],
  ['Vessel / macrophage peak', 'About day 3', 'About days 5–9'],
  ['Collagen maturation', 'Type III → I shift after about 3 weeks', 'Proliferation to ~6 months; remodeling 6–12+ months'],
  ['Final tissue', 'Mostly muscle plus thin scar seam', 'All scar, weaker and looser'],
  ['Key rehab focus', 'Progressive loading, then eccentrics', 'Early protected loading plus balance / proprioception']
];
function tableShot(ctx, t) {
  bg(ctx);
  const X = [70, 470, 960, 1530], top = 130;
  ctx.font = `700 16px ${F.mono}`; ['', 'MUSCLE', 'LIGAMENT'].forEach((h, i) => { ctx.fillStyle = i === 1 ? '#ef8a9a' : i === 2 ? LC.coll : COL.dim; ctx.fillText(h, X[i] + 16, top + 28); });
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(X[0], top + 42); ctx.lineTo(X[3], top + 42); ctx.stroke();
  let y = top + 42;
  TABLE.forEach((row, i) => {
    const t0 = 1.5 + i * 3.2, active = t >= t0 && t < t0 + 3.2, seen = t >= t0;
    ctx.font = `500 21px ${F.body}`;
    const l1 = wrap(ctx, row[1], X[2] - X[1] - 30), l2 = wrap(ctx, row[2], X[3] - X[2] - 30);
    const rh = Math.max(l1.length, l2.length) * 27 + 24;
    if (active) { ctx.fillStyle = 'rgba(242,184,75,.1)'; ctx.fillRect(X[0], y, X[3] - X[0], rh); }
    ctx.globalAlpha = seen ? 1 : .35;
    ctx.font = `700 23px ${F.display}`; ctx.fillStyle = COL.text; ctx.fillText(row[0].toUpperCase(), X[0] + 16, y + 34);
    ctx.font = `500 21px ${F.body}`; ctx.fillStyle = '#e9b8c0'; l1.forEach((l, k) => ctx.fillText(l, X[1] + 16, y + 33 + k * 27));
    ctx.fillStyle = '#efe3c4'; l2.forEach((l, k) => ctx.fillText(l, X[2] + 16, y + 33 + k * 27));
    ctx.globalAlpha = 1; y += rh; ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(X[0], y); ctx.lineTo(X[3], y); ctx.stroke();
  });
}
function endCard(ctx, t) {
  const s = LF0(); s.t = t; drawLigField(ctx, s); ctx.fillStyle = 'rgba(6,8,13,.84)'; ctx.fillRect(0, 0, W, H);
  bigText(ctx, 'MUSCLE REGROWS.', 800, 330, 96, seg(t, .2, 1));
  bigText(ctx, 'LIGAMENT PATCHES.', 800, 440, 96, seg(t, 1.2, 2), { color: COL.accent });
  bigText(ctx, 'Feeling better isn\'t the same as being healed.', 800, 540, 38, seg(t, 2.6, 3.4), { font: F.body, weight: 600, color: '#c9d1de' });
  bigText(ctx, 'PEAK WELLNESS SPORTS CHIROPRACTIC  ·  CLINICAL EDUCATION', 800, 700, 17, seg(t, 3.6, 4.4), { font: F.mono, weight: 500, color: COL.dim });
}

/* ---------- the scene list ---------- */
const SCENES = [
  {
    num: 'SCENE 00', title: 'Cold Open', when: 'Muscle vs ligament', shots: [
      { d: 9, draw: introDraw, noHeader: true, card: true, voice: [{ t: 0, text: 'Patched, not rebuilt. How a ligament heals after a sprain, and why it is different from muscle.' }] },
      { d: 18, draw: scene0, beats: [
        B(0, 'Muscle and ligament go through the same repair steps.', 'Muscle regrows. Ligament gets patched.'),
        B(5, 'But only one of them can actually rebuild itself.', 'Muscle regrows. Ligament gets patched.'),
        B(10, 'The other patches the hole with scar, and it never fully goes back to the original.', 'Muscle regrows. Ligament gets patched.')] }
    ]
  },
  {
    num: 'SCENE 01', title: 'Normal Ligament Anatomy', when: 'Before the injury', shots: [
      { d: 32, draw: scene1, beats: [
        B(0, 'A ligament is mostly type I collagen, arranged in tight parallel bundles.', 'Ligament is like a bundle of strong rope.'),
        B(8.6, 'It has very few cells and a poor blood supply.', 'Not many cells live there and not much blood gets in.'),
        B(15.4, 'Most of its vessels, nerves, and backup cells live in the outer layer, the epiligament.', 'The outer wrapper holds the plumbing and wiring.'),
        B(23.4, 'Ligaments also contain mechanoreceptors that tell the brain where the joint is.', 'Tiny sensors tell the brain where the joint is.')] },
      card({ title: 'Compared with muscle', items: [
        { text: 'Muscle is packed with blood vessels and has satellite cells under every fiber.' },
        { text: 'Ligament has neither, so it has to recruit help from outside.' },
        { text: 'Stecco link: the epiligament plays the same role for ligament that the epimysium and deep fascia play for muscle. It is the gliding, vessel-rich, cell-supplying envelope.', tag: 'MODEL/THEORY' }] })
    ]
  },
  {
    num: 'SCENE 02', title: 'The Tear', when: 'Day 0', shots: [
      { d: 30, draw: scene2, beats: [
        B(0, 'When the fibers snap, the ligament cells lose the tension they depend on, and many of them die within hours.', 'The rope frays and snaps. The few workers who lived there lose their job and die off.'),
        B(10.6, 'Bleeding comes mostly from the torn epiligament.', 'The rope frays and snaps. The few workers who lived there lose their job and die off.'),
        B(15.6, 'Unlike muscle, there\'s no contraction band to seal anything.', 'There\'s no emergency seal like muscle has.'),
        B(21.4, 'That is a muscle-fiber feature only.', 'There\'s no emergency seal like muscle has.')] },
      { d: 14, draw: gradingShot, beats: [
        B(0, 'Grade I: stretched fibers.', 'Grade I: stretched.'),
        B(4, 'Grade II: a partial tear.', 'Grade II: partly torn.'),
        B(8, 'Grade III: a complete tear, with joint laxity.', 'Grade III: torn all the way, and the joint gets loose.')] }
    ]
  },
  {
    num: 'SCENE 03', title: 'Inflammation', when: 'Days 0–5', shots: [
      { d: 28, draw: scene3, beats: [
        B(0, 'The first five days look almost exactly like muscle:', 'First responders arrive, plug the leak, and call in the repair crew.'),
        B(5, 'clot, growth factors, and a flood of neutrophils.', 'First responders arrive, plug the leak, and call in the repair crew.'),
        B(13, 'The fibrin clot becomes the temporary scaffold that everything else will build on.', 'First responders arrive, plug the leak, and call in the repair crew.')] },
      card({ title: 'Protect the scaffold', items: [
        { text: 'Protect, compress, elevate.' },
        { text: 'For a Grade III ankle sprain, a short period of rigid support, 10 days or less, is reasonable.', tag: 'HUMAN · GUIDELINE' },
        { text: 'Avoid long casting.' }] })
    ]
  },
  {
    num: 'SCENE 04', title: 'Cleanup Crew and Blood Vessels', when: 'Days 5–9', shots: [
      { d: 28, draw: scene4, beats: [
        B(0, 'Macrophages, T cells, VEGF, and new blood vessels peak between days 5 and 9,', 'The cleanup crew shows up later than in muscle because the roads to a ligament are smaller.'),
        B(7, 'a few days later than in muscle.', 'The cleanup crew shows up later than in muscle because the roads to a ligament are smaller.'),
        B(12, 'Most of this activity starts in the epiligament,', 'The outer wrapper is where most of the help comes from.'),
        B(17.4, 'and then moves into the gap as granulation tissue.', 'The outer wrapper is where most of the help comes from.')] },
      card({ title: 'Same handoff, later', items: [
        { text: 'Same M1 → M2 handoff as in muscle.' },
        { text: 'The same NSAID caution applies (see Scene 9).' },
        { text: 'Ligament-specific human data are limited.' }] })
    ]
  },
  {
    num: 'SCENE 05', title: 'Granulation and Type III Collagen', when: 'Weeks 1–4', shots: [
      { d: 32, draw: scene5, beats: [
        B(0, 'Type III collagen gene activity peaks around day 7,', 'The hole gets packed with thin, messy thread first.'),
        B(5, 'and continues for at least four weeks, mostly in the new scar.', 'The hole gets packed with thin, messy thread first.'),
        B(11.6, 'Type I collagen starts early too, peaking around days 7 to 14,', 'Some strong rope starts going in at the edges.'),
        B(17, 'both in the scar and at the old ends.', 'Some strong rope starts going in at the edges.'),
        B(22.4, 'From about day 9, cell death takes over as the overcrowded site thins itself out.', 'Then the extra workers go home.')] },
      { d: 10, draw: splitMuscleLig, beats: [
        B(0, 'In muscle, new fibers push down basement-membrane tunnels.', 'Muscle rebuilds from the inside.'),
        B(5, 'In ligament, only collagen threads fill the gap.', 'Ligament only gets thread.')] },
      card({ title: 'The weakest window', items: [
        { text: 'This is the weakest window.' },
        { text: 'Functional treatment, meaning early weight bearing with a brace or tape plus balance and neuromuscular exercise, beats immobilization for return to sport, swelling, and satisfaction in ankle sprains.', tag: 'HUMAN', cite: '21 trials' },
        { text: 'Loading tells the fibroblasts which direction to lay collagen.' }] })
    ]
  },
  {
    num: 'SCENE 06', title: 'Proliferation Continues', when: 'Week 6 to month 6', shots: [
      { d: 26, draw: scene6, beats: [
        B(0, 'For months, fibroblasts keep making collagen', 'The patch is still hardening for months.'),
        B(5, 'and slowly line it up along the lines of load.', 'The patch is still hardening for months.'),
        B(11, 'Myofibroblasts pull the scar together.', 'The patch is still hardening for months.'),
        B(16.4, 'But athletes often return to play long before this scar has matured.', 'You can play on it long before it\'s done healing.')] },
      { d: 16, draw: rtsShot, beats: [
        B(0, 'Ankle sprain return to sport is typically about one week for Grade I, two weeks for Grade II, and four weeks for Grade III.', 'Back to sport: about 1, 2, or 4 weeks.'),
        B(9, 'The scar is still maturing the whole time. That mismatch is why the next phase of rehab matters.', 'The patch is still hardening for months.')] }
    ]
  },
  {
    num: 'SCENE 07', title: 'Remodeling', when: 'Months 6–12 and beyond', shots: [
      { d: 16, draw: scene7, beats: [
        B(0, 'Cross-linking and alignment continue for 6 to 12 months,', 'The patch eventually gets strong,'),
        B(6, 'and some remodeling goes on for years.', 'The patch eventually gets strong,')] },
      { d: 24, draw: compareShot, beats: [
        B(0, 'The final tissue is scar: ligament-like, but with more type III collagen, thinner and less organized fibrils, and lower strength.', 'but it\'s never quite the original rope.'),
        B(9, 'In closely related tendon research, repaired tissue reaches up to 30% lower tensile strength.', 'but it\'s never quite the original rope.'),
        B(15.4, 'The scar may also heal slightly long, and the joint\'s position sensors are disrupted.', 'It\'s a bit looser and the joint\'s "GPS" doesn\'t work as well.')] },
      card({ title: 'Why sprains come back', items: [
        { text: 'This explains recurrent sprains and chronic ankle instability.' },
        { text: 'Balance and proprioceptive training reduces re-injury over 7–12 months.', tag: 'HUMAN' }] })
    ]
  },
  {
    num: 'SCENE 08', title: 'Why the ACL Is Different', when: 'MCL vs ACL', shots: [
      { d: 34, draw: scene8, beats: [
        B(0, 'The MCL heals well on its own.', 'The MCL heals because the glue can set.'),
        B(3.6, 'The ACL almost never does.', 'The MCL heals because the glue can set.'),
        B(8, 'It floats in synovial fluid, so a stable clot can\'t form between the ends.', 'The ACL is underwater in joint fluid, so the glue washes away.'),
        B(16.4, 'The unstable knee also keeps shifting, which works against healing.', 'The ACL is underwater in joint fluid, so the glue washes away.'),
        B(23.4, 'ACL cells and the ACL\'s epiligament also behave differently from the MCL\'s.', 'The ACL is underwater in joint fluid, so the glue washes away.')] },
      { d: 12, draw: bearShot, beats: [
        B(0, 'Bridge-enhanced ACL repair places a scaffold soaked in the patient\'s own blood into the gap, giving the clot something to hold onto.', 'A sponge gives the glue something to hold onto.')] },
      card({ title: 'ACL: what this means', items: [
        { text: 'Reconstruction remains standard.' },
        { text: 'Bridge-enhanced ACL repair (BEAR) places a scaffold soaked in the patient\'s own blood into the gap to give the clot something to hold onto.' },
        { text: 'It was non-inferior to autograft reconstruction at 2 years in a randomized trial, although re-tear risk may be higher.', tag: 'HUMAN' }] })
    ]
  },
  {
    num: 'SCENE 09', title: 'How Treatments Act', when: 'Day 0 to month 12', shots: [
      { d: 52, draw: treatShot, badges: t => { let c = null; TREAT.forEach(it => { if (t >= it.t && it.tag) c = it; else if (t >= it.t) c = null; }); return c ? [[c.tag, c.note || '']] : []; }, beats: [
        B(0, 'Here is where each treatment acts on the healing timeline.', 'Where each treatment fits.'),
        B(2, 'Brief protection, days 0 to 10 for Grade III: protect the clot so the scaffold can form.', 'Protect it early so the glue can set.'),
        B(9, 'Early protected loading: load is the signal that lines up the collagen.', 'Load lines up the new collagen.'),
        B(16, 'Balance and proprioception training: retrain the joint\'s GPS.', 'Retrain the joint\'s GPS.'),
        B(23, 'NSAIDs: short use for pain is common; long courses may blunt repair signaling. Ligament-specific human data are limited.', 'Short use for pain is common. Long courses may slow repair.'),
        B(30, 'Acetaminophen: pain relief with less effect on local repair signals.', 'Pain relief that leaves repair signals alone.'),
        B(37, 'Shockwave and PRP: growth-factor and vessel signaling, with animal and limited human data.', 'Promising, but not proven in people yet.'),
        B(44, 'Manual therapy and movement around the epiligament and fascia may help gliding and stiffness in the subacute and remodeling phases. Lasting structural effects are unproven.', 'May help stiffness. Not proven to change the tissue.')] }
    ]
  },
  {
    num: 'SCENE 10', title: 'Side-by-Side Summary', when: 'Same blueprint, different builders', shots: [
      { d: 18, draw: syncShot, beats: [
        B(0, 'Same blueprint, different builders.', 'Muscle regrows.'),
        B(4.5, 'Muscle rebuilds itself and leaves a thin seam.', 'Muscle regrows.'),
        B(10, 'Ligament fills the gap with a patch that hardens for a year.', 'Ligament patches.')] },
      { d: 26, draw: tableShot, beats: [
        B(0, 'Side by side: how each tissue heals, who rebuilds it, and what rehab has to focus on.', 'Muscle regrows. Ligament patches.'),
        B(18, 'Rehab has to respect that timeline: the athlete feels ready long before the tissue is.', 'Feeling better isn\'t the same as being healed.')] },
      { d: 9, draw: endCard, noHeader: true, card: true, voice: [{ t: .3, text: 'Muscle regrows. Ligament patches. Feeling better isn\'t the same as being healed.' }] }
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
function renderFilm(ctx, T, mode = 'sci') {
  const L = locate(T);
  ctx.save(); L.sh.draw(ctx, L.st, L.sh.d, L); ctx.restore();
  ctx.save(); chrome(ctx, L, mode, T); ctx.restore();
  return L;
}
