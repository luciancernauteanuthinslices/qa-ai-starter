#!/usr/bin/env node
// Simple JSON diff report writer
import fs from 'fs';
import path from 'path';

const [,, beforePath, afterPath] = process.argv;
if (!beforePath || !afterPath) {
  console.log('Usage: npm run diff:api -- <before.json> <after.json>');
  process.exit(1);
}

function diff(a, b, prefix='') {
  const changes = [];
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    const pa = (a||{})[k];
    const pb = (b||{})[k];
    const keyPath = prefix ? `${prefix}.${k}` : k;
    if (typeof pa === 'object' && pa && typeof pb === 'object' && pb) {
      changes.push(...diff(pa, pb, keyPath));
    } else if (JSON.stringify(pa) !== JSON.stringify(pb)) {
      changes.push({ path: keyPath, before: pa, after: pb });
    }
  }
  return changes;
}

const before = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
const after = JSON.parse(fs.readFileSync(afterPath, 'utf8'));
const changes = diff(before, after);

if (!fs.existsSync('reports/api')) fs.mkdirSync('reports/api', { recursive: true });
const md = ['# API Diff Report', '', '| Field | Before | After |', '|---|---|---|'];
for (const c of changes) {
  md.push(`| ${c.path} | \`${JSON.stringify(c.before)}\` | \`${JSON.stringify(c.after)}\` |`);
}
fs.writeFileSync('reports/api/diff_report.md', md.join('\n'), 'utf8');
console.log('Wrote reports/api/diff_report.md with', changes.length, 'changes.');
