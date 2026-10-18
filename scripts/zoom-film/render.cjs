// 사용: node render.cjs <출력폴더>  → <출력폴더>/{ko,en}/0000.jpg ... (38 s × 30 fps = 1140장씩)
const { chromium } = require('/Users/biteubag/control-tower/node_modules/playwright-core');
const path = require('path');
const fs = require('fs');
const outDir = process.argv[2];
for (const l of ['ko', 'en']) fs.mkdirSync(path.join(outDir, l), { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  const t0 = Date.now();
  // 폰 화면·머리글 글자가 언어마다 달라서 언어별로 따로 렌더한다
  for (const lang of ['ko', 'en']) {
    const p = await b.newPage({ viewport: { width: 600, height: 720 } });
    p.on('pageerror', (e) => console.log('pageerror', e.message));
    await p.goto('file://' + path.join(__dirname, 'scene.html') + '?lang=' + lang + (process.env.FMT ? '&fmt=' + process.env.FMT : '') + (process.env.STYLE ? '&style=' + process.env.STYLE : '') + (process.env.THEME ? '&theme=' + process.env.THEME : ''));
    await p.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
    const n = await p.evaluate(() => window.FRAMES);
    for (let i = 0; i < n; i++) {
      const jpg = await p.evaluate((i) => window.renderFrame(i), i);
      fs.writeFileSync(path.join(outDir, lang, String(i).padStart(4, '0') + '.jpg'), Buffer.from(jpg.split(',')[1], 'base64'));
      if (i % 120 === 0) console.log(`${lang} frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    await p.close();
  }
  console.log('done', ((Date.now() - t0) / 1000).toFixed(0), 's');
  await b.close();
})();
