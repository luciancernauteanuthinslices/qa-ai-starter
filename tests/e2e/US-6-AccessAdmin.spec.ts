import { test, expect } from '@playwright/test';
import { DashboardPage } from "../../pages/DashboardPage/DashboardPage";
import LoginPage from "../../pages/LoginPage/LoginPage";
import Sidebar from "../../pages/Sidebar/Sidebar";

test('Access admin page workflow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const sidebar = new Sidebar(page);

  await page.goto('/');
  await loginPage.doLogin(process.env.USERNAME!, process.env.PASSWORD!);
  await dashboardPage.assertHeading();
  
  await sidebar.goToAdmin();
  await sidebar.expectAdminpage();
});