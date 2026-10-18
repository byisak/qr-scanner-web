// 사용: node render.cjs <출력폴더>  → <출력폴더>/{ko,en}/0000.jpg ... (22 s × 30 fps = 660장)
const { chromium } = require('/Users/biteubag/control-tower/node_modules/playwright-core');
const path = require('path');
const fs = require('fs');
const outDir = process.argv[2];
for (const l of ['ko', 'en']) fs.mkdirSync(path.join(outDir, l), { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 600, height: 720 } });
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  await p.goto('file://' + path.join(__dirname, 'scene.html'));
  await p.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  const n = await p.evaluate(() => window.FRAMES);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const { ko, en } = await p.evaluate((i) => window.renderFrame(i), i);
    const name = String(i).padStart(4, '0') + '.jpg';
    fs.writeFileSync(path.join(outDir, 'ko', name), Buffer.from(ko.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(outDir, 'en', name), Buffer.from(en.split(',')[1], 'base64'));
    if (i % 60 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  console.log('done', ((Date.now() - t0) / 1000).toFixed(0), 's');
  await b.close();
})();
