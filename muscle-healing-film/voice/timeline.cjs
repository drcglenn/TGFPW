// Builds voice/timeline.json: per-shot piecewise-linear map from video time to shot time,
// stretching any caption window that is shorter than its spoken line.
const fs = require('fs');
const { shots } = JSON.parse(fs.readFileSync(__dirname + '/segments.json'));
const segs = JSON.parse(fs.readFileSync(__dirname + '/durations.json'));
const LEAD = 0.25, GAP = 0.6, TAIL = 0.9;
let V = 0, shotStart = 0; const out = { shots: [], audio: [] };
shots.forEach((sh, i) => {
  const ss = segs.filter(s => s.shot === i).sort((a, b) => a.t - b.t);
  const knots = [[V, 0]];
  if (ss.length && ss[0].t > 0) { V += ss[0].t; knots.push([V, ss[0].t]); }
  ss.forEach((s, k) => {
    const a = s.t, b = k + 1 < ss.length ? ss[k + 1].t : sh.d;
    const need = LEAD + s.dur + (k + 1 < ss.length ? GAP : TAIL);
    out.audio.push({ file: String(segs.indexOf(s)).padStart(3, '0') + '.wav', at: V + LEAD });
    V += Math.max(b - a, need); knots.push([V, b]);
  });
  if (!ss.length) { V += sh.d; knots.push([V, sh.d]); }
  out.shots.push({ filmStart: shotStart, d: sh.d, knots });
  shotStart += sh.d;
});
out.total = V;
fs.writeFileSync(__dirname + '/timeline.json', JSON.stringify(out));
console.log('film', shotStart.toFixed(1), 's -> voiced', V.toFixed(1), 's');
