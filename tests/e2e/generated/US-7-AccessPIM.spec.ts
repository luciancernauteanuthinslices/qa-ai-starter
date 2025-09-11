import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';
import {Sidebar} from '../../../pages/Sidebar/Sidebar';

test.describe('PIM Page Access', () => {
  test('User can access PIM page from dashboard', async ({ page }) => {
    // Set up base URL and credentials from environment variables
    const baseURL = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/';
    const username = process.env.USERNAME || 'Admin';
    const password = process.env.PASSWORD || 'admin123';

    // Initialize page objects
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const sidebar = new Sidebar(page);

    // Navigate to login page with proper wait
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // Perform login with error handling
    try {
      await loginPage.doLogin(username, password);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }

    // Wait for dashboard to load with explicit timeout
    await page.waitForSelector('h6:has-text("Dashboard")', { 
      state: 'visible', 
      timeout: 10000 
    });

    // Verify dashboard is loaded
    await dashboardPage.assertHeading();

    // Navigate to PIM page via sidebar with explicit wait
    await page.waitForSelector('a:has-text("PIM")', { state: 'visible' });
    await sidebar.goToPIM();

    // Wait and assert PIM page is accessed
    await page.waitForSelector('h6:has-text("PIM")', { 
      state: 'visible', 
      timeout: 10000 
    });
    await sidebar.expectPIMHeading();
  });
});