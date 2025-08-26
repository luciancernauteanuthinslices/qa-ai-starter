import { test, expect } from '@playwright/test';
import { DashboardPage } from "../../pages/DashboardPage/DashboardPage";
import LoginPage from "../../pages/LoginPage/LoginPage";

test('Change Password workflow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await page.goto('/');
  await loginPage.doLogin(process.env.USERNAME!, process.env.PASSWORD!);
  await dashboardPage.assertHeading();
  
  await dashboardPage.changePasswordAction();
  await dashboardPage.assertChangePasswordHeading();
});