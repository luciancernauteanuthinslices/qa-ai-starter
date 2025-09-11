import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test.describe('System Information', () => {
  test('View About System Information', async ({ page }) => {
    // Setup base URL with fallback
    const baseUrl = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/';
    
    // Initialize page objects
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Navigate to login page and wait for load
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    // Login with environment credentials 
    await loginPage.doLogin(
      process.env.USERNAME || 'Admin', 
      process.env.PASSWORD || 'admin123'
    );

    // Wait for dashboard to load
    await page.waitForLoadState('domcontentloaded');

    // Assert dashboard is visible with timeout
    await expect(dashboardPage.heading).toBeVisible({ timeout: 10000 });

    // Open About modal via profile button with explicit wait
    await page.waitForTimeout(1000); // Small delay to ensure page stability
    await dashboardPage.aboutAction();

    // Verify About heading is visible with extended timeout
    await expect(dashboardPage.aboutHeading).toBeVisible({ timeout: 5000 });
  });
});