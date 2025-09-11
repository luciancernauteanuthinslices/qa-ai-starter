import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import {Sidebar} from '../../../pages/Sidebar/Sidebar';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

test.describe('Employee Search Workflow', () => {
  test('Search for employee named Brown', async ({ page }) => {
    // Set up page objects
    const loginPage = new LoginPage(page);
    const sidebar = new Sidebar(page);
    const dashboardPage = new DashboardPage(page);

    // Navigate to base URL and login
    await loginPage.goto(process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/');
    await loginPage.doLogin(
      process.env.USERNAME || 'Admin', 
      process.env.PASSWORD || 'admin123'
    );

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await dashboardPage.assertHeading();

    // Navigate to PIM page
    await sidebar.goToPIM();
    await page.waitForLoadState('networkidle');
    await sidebar.expectPIMHeading();

    // Use robust locator for employee name input with multiple strategies
    const employeeNameInput = page.locator(
      'div.oxd-input-group:has(label:has-text("Employee Name")) input[placeholder="Type for hints..."]'
    );

    // Use robust locator for search button
    const searchButton = page.locator('button[type="submit"]');

    // Wait for input to be visible and interactive
    await employeeNameInput.waitFor({ state: 'visible' });
    
    // Enter search term with additional interaction
    await employeeNameInput.click();
    await employeeNameInput.fill('Brown');
    await page.keyboard.press('Enter');

    // Wait for search results
    await page.waitForLoadState('networkidle');

    // More robust search results validation
    const searchResults = page.locator('.oxd-table-body .oxd-table-row');
    
    // Assert search results are displayed
    await expect(searchResults.first()).toBeVisible();
    
    // Optional: Check if any rows contain 'Brown'
    const rowsWithBrown = searchResults.filter({ hasText: /Brown/i });
    await expect(rowsWithBrown.count()).toBeGreaterThan(0);
  });
});