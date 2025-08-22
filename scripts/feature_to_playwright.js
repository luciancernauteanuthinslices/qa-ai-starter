#!/usr/bin/env node
// Converts simple Gherkin .feature -> minimal Playwright spec scaffold
import fs from 'fs';
import path from 'path';

const [, , featuresDir='features', specsDir='tests/e2e'] = process.argv;

if (!fs.existsSync(specsDir)) fs.mkdirSync(specsDir, { recursive: true });

function parseSteps(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // Very simple parser for demo purposes
  const steps = lines.filter(l => /^(Given|When|Then|And)\b/i.test(l));
  return steps;
}

function stepToCode(step) {
  // naive mapping (teach beginners to replace with app-specific actions)
  if (/login page/i.test(step)) return "await page.goto(process.env.BASE_URL + '/');";
  if (/enter a valid email/i.test(step)) return "await page.fill('input[type='email']', 'user@example.com'); await page.fill('input[type='password']', 'Password123!');";
  if (/press the login button/i.test(step)) return "await page.click('button:has-text('Log in')');";
  if (/see my dashboard/i.test(step)) return "await page.waitForURL('**/dashboard');";
  return "// TODO: Implement step: " + step;
}

function toSpec(featurePath) {
  const raw = fs.readFileSync(featurePath, 'utf8');
  const steps = parseSteps(raw);
  const name = path.basename(featurePath).replace(/\.feature$/, '');
  const code = `import { test, expect } from '@playwright/test';

test('${name}', async ({ page }) => {
  ${steps.map(stepToCode).join('\n  ')}
  // Basic assertion to teach structure
  await expect(page).toHaveURL(/.+/);
});`;
  return code;
}

function run() {
  const files = fs.readdirSync(featuresDir).filter(f => f.endsWith('.feature'));
  for (const f of files) {
    const spec = toSpec(path.join(featuresDir, f));
    const out = path.join(specsDir, f.replace(/\.feature$/, '.spec.js'));
    fs.writeFileSync(out, spec, 'utf8');
    console.log('Spec scaffold created:', out);
  }
}

run();
