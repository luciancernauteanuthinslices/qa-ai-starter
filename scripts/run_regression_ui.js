#!/usr/bin/env node
// Runs Playwright visual test then creates pixel diffs
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ensure baseline exists; if not, create from current run
function ensureBaseline() {
  const cur = 'screenshots/current/home.png';
  const base = 'baselines/home.png';
  if (!fs.existsSync(base) && fs.existsSync(cur)) {
    fs.mkdirSync('baselines', { recursive: true });
    fs.copyFileSync(cur, base);
    console.log('Baseline created from current:', base);
  }
}

console.log('1) Running visual spec to capture current screenshots...');
spawnSync('npx', ['playwright', 'test', 'tests/e2e/visual.spec.js'], { stdio: 'inherit' });

ensureBaseline();

console.log('2) Generating visual diffs...');
spawnSync('node', ['scripts/ui_diff.js'], { stdio: 'inherit' });
