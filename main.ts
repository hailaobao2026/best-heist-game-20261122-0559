// 午夜金库 MIDNIGHT VAULT — make.fun 交卷程序（Node 22 标准库）。
// 把仓库里的 game/ 与 screenshots/ 复制到 /output，
// 并用随附的 make.fun 库写出 /output/dossier.json（裁判读的就是它）。
// 在评分器之外，MAKEFUN_OUTPUT_DIR 可以代替 /output：
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync, chmodSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

function copyTree(src, dest) {
  cpSync(src, dest, { recursive: true });
  // 评分器以另一个用户身份收集 /output：文件须人人可读（0644），目录须人人可进（0755）。
  const stack = [dest];
  while (stack.length > 0) {
    const cur = stack.pop();
    for (const name of readdirSync(cur)) {
      const p = join(cur, name);
      if (statSync(p).isDirectory()) {
        chmodSync(p, 0o755);
        stack.push(p);
      } else {
        chmodSync(p, 0o644);
      }
    }
  }
}

function fail(msg) {
  console.error(`main.ts: ${msg}`);
  process.exit(1);
}

if (!existsSync(gameDir)) fail('game/ is missing from the repository');
if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');

const shotFiles = readdirSync(shotsDir).filter((n) => !n.startsWith('.'));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  fail(`screenshots/ must hold 3 or 4 images, found ${shotFiles.length}`);
}
for (const name of shotFiles) {
  const bytes = statSync(join(shotsDir, name)).size;
  if (bytes > 262144) fail(`screenshots/${name} is ${bytes} bytes, over the 256 KiB cap`);
}

mkdirSync(outDir, { recursive: true });
copyTree(gameDir, join(outDir, 'game'));
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
copyTree(shotsDir, join(outDir, 'screenshots'));

// 裁判的上限（与密封评分的 gate.json 一致）：正文 160 KiB，
// 截图最多 4 张、每张 256 KiB，game/ 最多 993 项、48 MiB，路径最多 1000 字节。
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
chmodSync(dossierPath, 0o644);

const gameCount = countEntries(join(outDir, 'game'));
console.log(
  `Midnight Vault handed in: ${gameCount} game entries, ${shotFiles.length} screenshots, ` +
    `dossier ${Buffer.byteLength(dossier, 'utf8')} bytes -> ${relative(process.cwd(), outDir) || outDir}`,
);

function countEntries(dir) {
  let n = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop();
    for (const name of readdirSync(cur)) {
      n += 1;
      const p = join(cur, name);
      if (statSync(p).isDirectory()) stack.push(p);
    }
  }
  return n;
}
