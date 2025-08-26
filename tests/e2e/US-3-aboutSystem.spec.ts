import { test, expect } from '@playwright/test';
import LoginPage from "../../pages/LoginPage/LoginPage";
import { DashboardPage } from "../../pages/DashboardPage/DashboardPage";

test('Info About System workflow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await page.goto('/');
  await loginPage.doLogin(process.env.USERNAME!, process.env.PASSWORD!);
  await dashboardPage.assertHeading();
  await dashboardPage.aboutAction();
  await dashboardPage.assertAboutHeading();
});