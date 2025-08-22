#!/usr/bin/env node
// Compare baseline vs current screenshots with pixelmatch
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const baselineDir = 'baselines';
const currentDir = 'screenshots/current';
const outDir = 'reports/ui';

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function compare(name) {
  const bPath = path.join(baselineDir, name);
  const cPath = path.join(currentDir, name);
  if (!fs.existsSync(bPath) || !fs.existsSync(cPath)) {
    console.warn('Missing file for', name);
    return null;
  }
  const baseline = PNG.sync.read(fs.readFileSync(bPath));
  const current = PNG.sync.read(fs.readFileSync(cPath));
  const { width, height } = baseline;
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(baseline.data, current.data, diff.data, width, height, { threshold: 0.1 });
  const diffPath = path.join(outDir, name.replace(/\.png$/, '.diff.png'));
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return { name, mismatched, diffPath };
}

function run() {
  const files = fs.existsSync(currentDir) ? fs.readdirSync(currentDir).filter(f => f.endsWith('.png')) : [];
  const results = [];
  for (const f of files) {
    const r = compare(f);
    if (r) results.push(r);
  }
  const md = ['# Visual Diff Report', '', '| File | Pixels mismatched | Diff |', '|---|---:|---|'];
  for (const r of results) {
    md.push(`| ${r.name} | ${r.mismatched} | ${r.diffPath} |`);
  }
  if (!fs.existsSync('reports')) fs.mkdirSync('reports');
  fs.writeFileSync('reports/ui_diff_report.md', md.join('\n'), 'utf8');
  console.log('Wrote reports/ui_diff_report.md');
}
run();
