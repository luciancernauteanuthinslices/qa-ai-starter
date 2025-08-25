import { test, expect } from '@playwright/test';
import LoginPage from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

test('Login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto('/');
  await loginPage.doLogin(process.env.USERNAME!, process.env.PASSWORD!);
  await dashboardPage.assertHeading();
});