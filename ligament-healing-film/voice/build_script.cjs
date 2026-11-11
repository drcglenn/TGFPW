// Dumps every voiced segment (shot index, shot-local start time, text) to voice/segments.json
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = { Math, console }; vm.createContext(ctx);
const dir = path.resolve(__dirname, '..');
vm.runInContext(fs.readFileSync(dir + '/../muscle-healing-film/film-core.js', 'utf8') + '\n' + fs.readFileSync(dir + '/lig-engine.js', 'utf8') + '\n' + fs.readFileSync(dir + '/lig-scenes.js', 'utf8') + '\nthis.SC = SCENES; this.CARDTXT = null;', ctx);
const shots = [], segs = [];
let gi = 0;
for (const sc of ctx.SC) for (const sh of sc.shots) {
  shots.push({ d: sh.d, scene: sc.num });
  if (sh.beats) sh.beats.forEach(b => segs.push({ shot: gi, t: b.t, text: b.s }));
  else if (sh.cardData) {
    segs.push({ shot: gi, t: 0, text: 'Clinical tie-in. ' + sh.cardData.title + '.' });
    sh.cardData.items.forEach((it, i) => segs.push({ shot: gi, t: .7 + i * 2.6, text: it.text }));
  } else if (sh.voice) sh.voice.forEach(v => segs.push({ shot: gi, t: v.t, text: v.text }));
  gi++;
}
fs.writeFileSync(__dirname + '/segments.json', JSON.stringify({ shots, segs }, null, 1));
console.log(shots.length, 'shots,', segs.length, 'segments');
