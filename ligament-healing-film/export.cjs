// Usage: node export.cjs frames <outdir> t1 t2 ...   |   node export.cjs video <out.mp4> [fps] [mode] [voice/timeline.json]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
(async () => {
  const [cmd, out, ...rest] = process.argv.slice(2);
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'render.html'));
  const fontsOk = await page.evaluate(() => window.FONTS_READY);
  const total = await page.evaluate(() => window.TOTAL_);
  console.error('fonts:', fontsOk, 'total:', total.toFixed(1), 's');
  console.error(JSON.stringify(await page.evaluate(() => window.SCENE_STARTS)));
  const grab = async (t, mode, type = 'image/jpeg') => {
    const d = await page.evaluate(([t, mode, type]) => { window.RENDER(t, mode); return document.getElementById('c').toDataURL(type, 0.92); }, [t, mode, type]);
    return Buffer.from(d.split(',')[1], 'base64');
  };
  if (cmd === 'frames') {
    fs.mkdirSync(out, { recursive: true });
    for (const ts of rest) { const t = +ts; fs.writeFileSync(path.join(out, `f_${t.toFixed(1).padStart(6, '0')}.jpg`), await grab(t, 'sci')); }
  } else if (cmd === 'video') {
    const fps = +(rest[0] || 30), mode = rest[1] || 'sci', warp = rest[2] ? JSON.parse(fs.readFileSync(rest[2])) : null;
    // With a voice timeline, video time is mapped onto film time so each caption window fits its spoken line.
    const filmT = tau => {
      if (!warp) return tau;
      for (const sh of warp.shots) {
        const k = sh.knots; if (tau >= k[k.length - 1][0]) continue;
        for (let j = 1; j < k.length; j++) if (tau < k[j][0]) {
          const f = (tau - k[j - 1][0]) / (k[j][0] - k[j - 1][0]);
          return sh.filmStart + Math.min(sh.d - 0.001, k[j - 1][1] + f * (k[j][1] - k[j - 1][1]));
        }
      }
      return total - 0.001;
    };
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.floor((warp ? warp.total : total) * fps);
    for (let i = 0; i < n; i++) {
      const buf = await grab(filmT(i / fps), mode);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 300 === 0) console.error(`frame ${i}/${n}`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  if (errs.length) console.error('ERRORS:', errs.slice(0, 10).join('\n'));
  await browser.close();
})();
