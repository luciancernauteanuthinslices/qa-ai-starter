import { test } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';
import Sidebar from '../../../pages/Sidebar/Sidebar';

test('Navigate to PIM page from dashboard', async ({ page }) => {
  // Initialize page objects
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const sidebar = new Sidebar(page);

  // Navigate to login page and login
  await loginPage.goto(process.env.BASE_URL);
  await loginPage.doLogin(process.env.USERNAME, process.env.PASSWORD);

  // Assert dashboard is visible
  await dashboardPage.assertHeading();

  // Navigate to PIM page
  await sidebar.goToPIM();

  // Verify PIM page is accessed
  await sidebar.expectPIMHeading();
});