import { test } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';
import Sidebar from '../../../pages/Sidebar/Sidebar';

test('Access admin page from dashboard', async ({ page }) => {
  // Initialize page objects
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const sidebar = new Sidebar(page);

  // Navigate to login page
  await page.goto(process.env.BASE_URL);

  // Login 
  await loginPage.doLogin(process.env.USERNAME, process.env.PASSWORD);

  // Assert dashboard is visible
  await dashboardPage.assertHeading();

  // Navigate to admin page
  await sidebar.goToAdmin();

  // Assert admin page is accessed
  await sidebar.expectAdminpage();
});