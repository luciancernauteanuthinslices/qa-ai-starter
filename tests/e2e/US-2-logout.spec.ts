import { test, expect } from '@playwright/test';
import LoginPage from "../../pages/LoginPage/LoginPage";
import { DashboardPage } from "../../pages/DashboardPage/DashboardPage";

test('Logout user workflow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto('/');
  await loginPage.doLogin(process.env.USERNAME!, process.env.PASSWORD!);
  await dashboardPage.assertHeading();
  await dashboardPage.logOutAction();
  await loginPage.assertLoginHeading();
});