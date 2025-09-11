import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';
import {Sidebar} from '../../../pages/Sidebar/Sidebar';

test.describe('Time Page Access', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Navigate to base URL with proper wait
    await page.goto(process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/', {
      waitUntil: 'networkidle'
    });
    
    // Perform login with robust locators
    await loginPage.doLogin(
      process.env.USERNAME || 'Admin', 
      process.env.PASSWORD || 'admin123'
    );
    
    // Wait for dashboard to load
    const dashboardPage = new DashboardPage(page);
    await page.waitForSelector('h6:has-text("Dashboard")', { state: 'visible' });
    await dashboardPage.assertHeading();
  });

  test('User can access Time page from sidebar', async ({ page }) => {
    // Use more robust selector for Time button
    const timeButton = page.locator('a.oxd-main-menu-item:has-text("Time")');
    
    // Wait and click with retry
    await timeButton.waitFor({ state: 'visible' });
    await timeButton.click({ trial: true });
    await timeButton.click();
    
    // Wait for Time page to load with multiple selector strategies
    await page.waitForSelector('h6:has-text("Timesheets")', { state: 'visible' });
    
    // Verify Time page heading
    const timePageHeading = page.locator('h6:has-text("Timesheets")');
    await expect(timePageHeading).toBeVisible();
    
    // Verify Timesheets Pending Action section with complex selector
    const pendingActionSection = page.locator('div.oxd-table-header:has-text("Timesheets Pending Action")');
    await expect(pendingActionSection).toBeVisible();
  });
});