import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test('Successful login with valid credentials', async ({ page }) => {
  // Initialize page objects
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // Navigate to login page
  await loginPage.goto(process.env.BASE_URL);

  // Perform login
  await loginPage.doLogin(process.env.USERNAME, process.env.PASSWORD);

  // Assert dashboard is visible
  await dashboardPage.assertHeading();
});