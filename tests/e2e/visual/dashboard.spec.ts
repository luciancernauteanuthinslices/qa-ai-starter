import { test, expect } from '@playwright/test';

test.describe('@visual Dashboard', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('header snapshot', async ({ page }) => {
    await page.goto('/web/index.php/dashboard/index');
    const header = page.locator('header'); // adjust to OrangeHRM header wrapper
    await expect(header).toHaveScreenshot('header.png');
  });
});