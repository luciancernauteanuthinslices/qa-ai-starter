import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test.describe('Change Password Workflow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Use the OrangeHRM demo site URL directly
    const baseUrl = 'https://opensource-demo.orangehrmlive.com/';
    
    // Initialize page objects
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Navigate and login
    await page.goto(baseUrl);
    await loginPage.doLogin('Admin', 'admin123');

    // Wait for dashboard to load
    await page.waitForSelector('h6:has-text("Dashboard")', { state: 'visible' });
    
    // Validate login was successful
    await dashboardPage.assertHeading();
  });

  test('User can access Change Password dialog', async ({ page }) => {
    // Add explicit wait before interaction
    await page.waitForTimeout(1000);

    // Trigger Change Password workflow using page object method
    await dashboardPage.changePasswordAction();

    // Wait for Change Password heading to be visible
    await page.waitForSelector('h6:has-text("Update Password")', { state: 'visible' });

    // Assert Change Password heading is visible
    await dashboardPage.assertChangePasswordHeading();
  });
});