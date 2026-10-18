// 사용: node stills.cjs <출력폴더> t1 t2 ...  → 시각별 정지 화면 (한국어 머리글)
const { chromium } = require('/Users/biteubag/control-tower/node_modules/playwright-core');
const path = require('path');
const fs = require('fs');
const [outDir, ...ts] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 600, height: 720 } });
  p.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text().slice(0, 200)); });
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  await p.goto('file://' + path.join(__dirname, 'scene.html') + '?lang=' + (process.env.LANG_HUD || 'ko'));
  await p.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  for (const t of ts) {
    const t0 = Date.now();
    const data = await p.evaluate((t) => window.renderFrame(Math.round(Number(t) * 30)), t);
    fs.writeFileSync(path.join(outDir, `t${String(t).padStart(5, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
    console.log('t', t, Date.now() - t0, 'ms');
  }
  await b.close();
})();
