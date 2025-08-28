import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test('User can logout from dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // Navigate to login page
  await loginPage.goto(process.env.BASE_URL);

  // Login 
  await loginPage.doLogin(process.env.USERNAME, process.env.PASSWORD);

  // Assert dashboard is visible
  await dashboardPage.assertHeading();

  // Logout
  await dashboardPage.logOutAction();

  // Verify redirected to login page
  await loginPage.assertLoginHeading();
});