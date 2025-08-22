import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('visual: homepage', async ({ page }) => {
  await page.goto('/');
  const dir = 'screenshots/current';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'home.png');
  await page.screenshot({ path: file, fullPage: true });
  console.log('Saved current screenshot:', file);
});
