import { test, expect } from '@playwright/test';
import LoginPage from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

test('User logs out successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto('/');
  await loginPage.doLogin(process.env.USERNAME!, process.env.PASSWORD!);
  await dashboardPage.assertHeading();

  await page.getByRole('img', { name: /profile/i }).click();
  await page.getByRole('button', { name: /Logout/i }).click();

  await expect(page).toHaveURL(/login/);
});