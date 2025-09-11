import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test.describe('User Logout Workflow', () => {
  test.use({ storageState: undefined });

  test('User can successfully logout', async ({ page }) => {
    // Configure base URL and credentials
    const baseUrl = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/';
    const username = process.env.USERNAME || 'Admin';
    const password = process.env.PASSWORD || 'admin123';

    // Initialize page objects
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Navigate to login page with wait
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    // Perform login with explicit waits
    await loginPage.username.waitFor({ state: 'visible' });
    await loginPage.doLogin(username, password);

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await dashboardPage.assertHeading();

    // Perform logout action with explicit waits
    await page.waitForTimeout(1000); // Small buffer for UI stability
    await dashboardPage.logOutAction();

    // Wait for login page to load
    await page.waitForLoadState('networkidle');

    // Assert login page is visible with multiple checks
    await expect(loginPage.loginHeading).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/login/i, { timeout: 10000 });
  });
});