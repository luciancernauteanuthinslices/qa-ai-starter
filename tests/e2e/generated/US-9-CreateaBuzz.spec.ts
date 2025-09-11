import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';
import {Sidebar} from '../../../pages/Sidebar/Sidebar';

test.describe('Buzz Creation Workflow', () => {
  test('should create a new buzz message', async ({ page }) => {
    // Arrange: Navigate and Login
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const sidebar = new Sidebar(page);

    // Navigate to the base URL
    await page.goto(process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/');
    
    // Act: Login
    await loginPage.doLogin(
      process.env.USERNAME || 'Admin', 
      process.env.PASSWORD || 'admin123'
    );

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Assert: Verify Dashboard Loaded
    await dashboardPage.assertHeading();

    // Act: Navigate to Buzz 
    // Use a more robust selector for Buzz link
    const buzzButton = page.locator('a:has-text("Buzz")');
    await buzzButton.click();

    // Wait for Buzz page to load
    await page.waitForSelector('textarea[placeholder="What\'s on your mind?"]', { state: 'visible' });

    // Assert: Buzz Page Accessed
    const buzzTextarea = page.locator('textarea[placeholder="What\'s on your mind?"]');
    await expect(buzzTextarea).toBeVisible();

    // Act: Create Buzz Message
    const buzzMessage = `Automated Buzz Test: ${new Date().toLocaleString()}`;
    await buzzTextarea.fill(buzzMessage);

    // Post the Buzz
    // Use a more specific button selector
    const postButton = page.locator('button:has-text("Post")');
    await postButton.click();

    // Wait for post to be visible
    await page.waitForSelector(`text="${buzzMessage}"`, { state: 'visible', timeout: 10000 });

    // Assert: Buzz Posted
    const latestPost = page.locator(`text="${buzzMessage}"`);
    await expect(latestPost).toBeVisible();
  });
});