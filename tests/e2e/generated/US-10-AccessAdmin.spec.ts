import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';
import {Sidebar} from '../../../pages/Sidebar/Sidebar';

test.describe('My Info Page Access', () => {
  test('User can access My Info page from dashboard', async ({ page }) => {
    // Arrange: Navigate and Login
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const sidebar = new Sidebar(page);

    // Navigate to base URL with wait
    await page.goto(process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/', { 
      waitUntil: 'networkidle' 
    });
    
    // Act: Perform login with wait
    await loginPage.doLogin(
      process.env.USERNAME || 'Admin', 
      process.env.PASSWORD || 'admin123'
    );

    // Wait for dashboard to load
    await page.waitForSelector('h6:has-text("Dashboard")', { state: 'visible' });

    // Assert: Verify dashboard is loaded
    await dashboardPage.assertHeading();

    // Act: Navigate to My Info page using robust selector
    const myInfoButton = page.locator('a:has-text("My Info")');
    await myInfoButton.click();

    // Wait for My Info page to load
    await page.waitForSelector('h6:has-text("Personal Details")', { state: 'visible' });

    // Assert: My Info page is accessed
    const personalDetailsHeading = page.locator('h6:has-text("Personal Details")');
    await expect(personalDetailsHeading).toBeVisible();
  });
});