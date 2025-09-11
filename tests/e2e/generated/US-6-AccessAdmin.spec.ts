import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import {DashboardPage} from '../../../pages/DashboardPage/DashboardPage';
import {Sidebar} from '../../../pages/Sidebar/Sidebar';

test.describe('Admin Page Access', () => {
  test.beforeEach(async ({ page }) => {
    // Create login page instance
    const loginPage = new LoginPage(page);
    
    // Navigate to base URL with explicit wait
    await page.goto(process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/', {
      waitUntil: 'networkidle'
    });
    
    // Login with credentials 
    await loginPage.doLogin(
      process.env.USERNAME || 'Admin', 
      process.env.PASSWORD || 'admin123'
    );

    // Wait for dashboard to load
    await page.waitForSelector('h6:has-text("Dashboard")', { state: 'visible' });
  });

  test('Should access admin page from dashboard sidebar', async ({ page }) => {
    // Initialize page objects
    const dashboardPage = new DashboardPage(page);
    const sidebar = new Sidebar(page);

    // Verify dashboard is visible after login
    await dashboardPage.assertHeading();

    // Wait and click on Admin button in sidebar with retry
    await page.waitForSelector('a:has-text("Admin")', { state: 'visible' });
    await sidebar.goToAdmin();

    // Wait for admin page to load and assert
    await page.waitForSelector('h6:has-text("System Users")', { state: 'visible' });
    await sidebar.expectAdminpage();
  });
});