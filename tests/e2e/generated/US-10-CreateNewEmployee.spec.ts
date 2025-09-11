import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import {Sidebar} from '../../../pages/Sidebar/Sidebar';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';

// Utility function to generate random employee data
function generateEmployeeData() {
  const firstName = `Brown${Math.random().toString(36).substring(7)}`;
  const lastName = `Employee${Math.random().toString(36).substring(7)}`;
  return { firstName, lastName };
}

test('Add new employee workflow', async ({ page }) => {
  // Arrange: Login and navigate to dashboard
  const loginPage = new LoginPage(page);
  const sidebar = new Sidebar(page);
  const dashboardPage = new DashboardPage(page);

  // Navigate to base URL and login
  await page.goto(process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/');
  await loginPage.doLogin(
    process.env.USERNAME || 'Admin', 
    process.env.PASSWORD || 'admin123'
  );

  // Wait for dashboard to load
  await page.waitForLoadState('networkidle');
  await dashboardPage.assertHeading();

  // Act: Navigate to PIM page
  await sidebar.goToPIM();
  await sidebar.expectPIMHeading();

  // Wait for PIM page to load completely
  await page.waitForLoadState('networkidle');

  // Locate PIM page elements using robust selectors
  const addButton = page.locator('button:has-text("Add")');
  const firstNameInput = page.locator('input[name="firstName"]');
  const lastNameInput = page.locator('input[name="lastName"]');
  const saveButton = page.locator('button[type="submit"]');

  // Generate random employee data
  const employeeData = generateEmployeeData();

  // Add new employee
  await addButton.click();
  
  // Wait for add employee form to load
  await page.waitForSelector('form.oxd-form', { state: 'visible' });

  // Fill employee details
  await firstNameInput.fill(employeeData.firstName);
  await lastNameInput.fill(employeeData.lastName);
  await saveButton.click();

  // Wait for save to complete
  await page.waitForLoadState('networkidle');

  // Assert: Verify Personal Details page is accessed
  const personalDetailsHeading = page.locator('h6:has-text("Personal Details")');
  await expect(personalDetailsHeading).toBeVisible();

  // Navigate to Employee List to verify
  const employeeListLink = page.locator('a:has-text("Employee List")');
  await employeeListLink.click();

  // Wait for Employee List to load
  await page.waitForLoadState('networkidle');

  // Search for the newly added employee
  const searchNameInput = page.locator('input[placeholder="Type for hints..."]');
  const searchButton = page.locator('button[type="submit"]');
  
  await searchNameInput.fill(`${employeeData.firstName} ${employeeData.lastName}`);
  await searchButton.click();

  // Wait for search results
  await page.waitForLoadState('networkidle');

  // Verify employee is in the list
  const employeeRow = page.locator(`div.oxd-table-row:has-text("${employeeData.firstName} ${employeeData.lastName}")`);
  await expect(employeeRow).toBeVisible();
});