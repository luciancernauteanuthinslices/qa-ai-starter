import { test } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test('Access system information from profile menu', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto(process.env.BASE_URL);
  await loginPage.doLogin(process.env.USERNAME, process.env.PASSWORD);
  
  await dashboardPage.assertHeading();
  await dashboardPage.aboutAction();
  await dashboardPage.assertAboutHeading();
});