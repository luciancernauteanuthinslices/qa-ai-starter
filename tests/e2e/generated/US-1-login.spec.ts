import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test.describe('User Login Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base URL with extended timeout
    await page.goto(process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
  });

  test('Successful login with valid credentials', async ({ page }) => {
    // Use environment variables for credentials, with fallback default
    const username = process.env.USERNAME || 'Admin';
    const password = process.env.PASSWORD || 'admin123';

    // Create page objects
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Enhanced login with multiple selector strategies
    await test.step('Enter Login Credentials', async () => {
      // Use multiple selector strategies for username
      await page.locator('input[name="username"]').fill(username);
      await page.locator('input[placeholder="Username"]').fill(username);

      // Use multiple selector strategies for password
      await page.locator('input[name="password"]').fill(password);
      await page.locator('input[placeholder="Password"]').fill(password);
    });

    // Click login with robust selector
    await test.step('Submit Login', async () => {
      await page.locator('button[type="submit"]').click();
      
      // Wait for navigation or dashboard load
      await page.waitForURL('**/dashboard/index', { timeout: 10000 });
    });

    // Comprehensive login verification
    await test.step('Verify Login', async () => {
      // Check multiple indicators of successful login
      await expect(page).toHaveURL(/dashboard\/index/);
      
      // Wait for dashboard elements to be visible
      await page.waitForSelector('.oxd-topbar-header', { state: 'visible', timeout: 10000 });
      
      // Verify dashboard header or specific element
      const dashboardHeader = page.locator('h6:has-text("Dashboard")');
      await expect(dashboardHeader).toBeVisible({ timeout: 5000 });
    });
  });

  // Add error handling test for invalid login
  test('Failed login with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Enter Invalid Credentials', async () => {
      await page.locator('input[name="username"]').fill('InvalidUser');
      await page.locator('input[name="password"]').fill('WrongPassword');
    });

    await test.step('Submit Login', async () => {
      await page.locator('button[type="submit"]').click();
    });

    await test.step('Verify Login Error', async () => {
      // Wait for and check error message
      const errorMessage = page.locator('.oxd-alert-content-text');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      await expect(errorMessage).toHaveText(/Invalid credentials/);
    });
  });
});