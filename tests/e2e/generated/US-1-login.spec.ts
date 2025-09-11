import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test.describe('User Login Workflow', () => {
  test('Successfully login with valid credentials', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const baseUrl = 'https://opensource-demo.orangehrmlive.com/';
    const username = 'Admin';
    const password = 'admin123';

    // Act
    await page.goto(baseUrl);
    
    // Wait for login page to load completely
    await page.waitForSelector('input[name="username"]', { state: 'visible' });
    
    // Robust login with multiple selector strategies
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard/index', { timeout: 10000 });

    // Assert
    await expect(page).toHaveURL(/dashboard/);
    await dashboardPage.assertHeading();
  });

  test('Login fails with invalid credentials', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const baseUrl = 'https://opensource-demo.orangehrmlive.com/';

    // Act
    await page.goto(baseUrl);
    
    // Wait for login page elements
    await page.waitForSelector('input[name="username"]', { state: 'visible' });

    // Use robust selectors for login
    await page.locator('input[name="username"]').fill('invaliduser');
    await page.locator('input[name="password"]').fill('invalidpass');
    await page.locator('button[type="submit"]').click();

    // Assert
    // Use multiple strategies to catch error message
    const errorLocator = page.locator('.oxd-alert-content-text');
    await expect(errorLocator).toBeVisible({ timeout: 5000 });
  });
});