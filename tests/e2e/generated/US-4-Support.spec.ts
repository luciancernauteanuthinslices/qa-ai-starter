import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test.describe('Support Section Access', () => {
  test('User can access Support section', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Act: Navigate and Login
    await page.goto(process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/');
    
    // Wait for login page to load
    await page.waitForSelector('input[name="username"]', { state: 'visible' });
    
    await loginPage.doLogin(
      process.env.USERNAME || 'Admin', 
      process.env.PASSWORD || 'admin123'
    );

    // Wait for dashboard to load
    await page.waitForSelector('h6:has-text("Dashboard")', { state: 'visible' });

    // Assert: Verify Dashboard 
    await dashboardPage.assertHeading();

    // Act: Open Support section with explicit waits
    await page.waitForSelector('img[alt="profile picture"]', { state: 'visible' });
    await dashboardPage.supportAction();

    // Wait for support page to load
    await page.waitForSelector('h1:has-text("Getting Started with OrangeHRM")', { state: 'visible' });

    // Assert: Verify Support page is visible
    await dashboardPage.assertSupportHeading();
  });
});