import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';
import Sidebar from '../../../pages/Sidebar/Sidebar';

test('Search for an employee named Brown', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const sidebar = new Sidebar(page);

  // Login
  await loginPage.goto(process.env.BASE_URL);
  await loginPage.doLogin(process.env.USERNAME, process.env.PASSWORD);
  await dashboardPage.assertHeading();

  // Navigate to PIM
  await sidebar.goToPIM();
  await sidebar.expectPIMHeading();
});