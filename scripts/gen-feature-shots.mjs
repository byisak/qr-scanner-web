// public/features/<언어>/*.webp 목록을 content/features/shots.generated.ts 로 만든다.
// 서버리스(Vercel)에서는 실행 중에 public 폴더를 읽을 수 없어서 빌드 전에 목록을 고정한다. (npm prebuild)
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'public', 'features');
const list = [];
if (fs.existsSync(root)) {
  for (const locale of fs.readdirSync(root).sort()) {
    const dir = path.join(root, locale);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      if (/\.(webp|png|jpg)$/.test(f)) list.push(`${locale}/${f}`);
    }
  }
}
const out = `// 자동 생성 파일 (scripts/gen-feature-shots.mjs). 직접 고치지 마세요.\nexport const FEATURE_SHOTS: ReadonlySet<string> = new Set(${JSON.stringify(list, null, 2)});\n`;
fs.writeFileSync(path.join(process.cwd(), 'content', 'features', 'shots.generated.ts'), out);
console.log(`feature shots: ${list.length}`);
