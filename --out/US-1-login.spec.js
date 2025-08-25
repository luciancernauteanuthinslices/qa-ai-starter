import { test, expect } from '@playwright/test';

test('US-1-login', async ({ page }) => {
  
  // Basic assertion to teach structure
  await expect(page).toHaveURL(/.+/);
});