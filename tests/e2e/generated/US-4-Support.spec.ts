import { test } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test('Access Support page from profile menu', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // Login
  await page.goto(process.env.BASE_URL);
  await loginPage.doLogin(process.env.USERNAME, process.env.PASSWORD);
  
  // Verify dashboard and access support page
  await dashboardPage.assertHeading();
  await dashboardPage.supportAction();
  await dashboardPage.assertSupportHeading();
});