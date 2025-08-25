/**
 * Sumarizeaza dif-urile de screenshot Playwright (cauta *-diff.png in test-results)
 * Output: reports/ui/diff.md
 */
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'reports/ui';
fs.mkdirSync(outDir, { recursive: true });

function listDiffs(dir: string) {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (p: string) => {
    for (const e of fs.readdirSync(p)) {
      const full = path.join(p, e);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (/-diff\.png$/i.test(e)) out.push(full);
    }
  };
  walk(dir);
  return out;
}

const diffs = listDiffs('test-results');
const rows = diffs.map(d => `| ${path.basename(d)} | diff |`).join('\n');
const md = `# UI diffs\n\n${rows ? `| File | Status |\n|---|---|\n${rows}` : 'No visual diffs'}\n`;
fs.writeFileSync(path.join(outDir, 'diff.md'), md, 'utf8');
console.log(`🖼️  UI diff summary → ${path.join(outDir, 'diff.md')}`);
