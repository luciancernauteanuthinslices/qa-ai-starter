import { test, expect } from '@playwright/test';
import LoginPage from "../../pages/LoginPage/LoginPage";
import { DashboardPage } from "../../pages/DashboardPage/DashboardPage";
import Sidebar from "../../pages/Sidebar/Sidebar";

test('Access admin page workflow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const sidebar = new Sidebar(page);

  await loginPage.goto(process.env.BASE_URL!);
  await loginPage.doLogin(process.env.USERNAME!, process.env.PASSWORD!);
  await dashboardPage.assertHeading();
  
  await sidebar.goToAdmin();
  await sidebar.expectAdminpage();
});