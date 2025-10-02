import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage/DashboardPage';
import { Sidebar } from '../../../pages/Sidebar/Sidebar';
import AddCandidatePage from '../../../pages/AddCandidatePage/AddCandidatePage';

test.describe('Recruitment - Add New Candidate', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let sidebar: Sidebar;
  let addCandidatePage: AddCandidatePage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    sidebar = new Sidebar(page);
    addCandidatePage = new AddCandidatePage(page);

    // Login
    await page.goto(process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com');
    await loginPage.doLogin(
      process.env.USERNAME || 'Admin', 
      process.env.PASSWORD || 'admin123'
    );

    // Wait for dashboard to load
    await page.waitForSelector('.oxd-layout-context', { state: 'visible' });
  });

  test('Add a new candidate through Recruitment page', async ({ page }) => {
    // Navigate to Recruitment - Add Candidate page
    await page.goto(`${process.env.BASE_URL}/web/index.php/recruitment/addCandidate`);
    
    // Wait for page to load
    // await page.waitForSelector('form.oxd-form', { state: 'visible' });

    // Generate unique test data
    const timestamp = Date.now();
    const candidateData = {
      firstName: `John${timestamp}`,
      lastName: `Doe${timestamp}`,
      email: `johndoe${timestamp}@example.com`,
      contactNo: `+1234567${timestamp % 10000}`
    };

    // Complex locators using OrangeHRM-specific patterns
    const firstNameInput = page.locator('input[name="firstName"]');
    const lastNameInput = page.locator('input[name="lastName"]');
    const emailInput = page.locator('input[placeholder="Type candidate email"]');
    const contactNoInput = page.locator('input[placeholder="Type contact number"]');
    const saveButton = page.locator('button[type="submit"]');

    // Fill in candidate details with explicit waits
    await firstNameInput.waitFor({ state: 'visible' });
    await firstNameInput.fill(candidateData.firstName);

    await lastNameInput.waitFor({ state: 'visible' });
    await lastNameInput.fill(candidateData.lastName);

    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill(candidateData.email);

    await contactNoInput.waitFor({ state: 'visible' });
    await contactNoInput.fill(candidateData.contactNo);

    // Save the new candidate
    await saveButton.click();

    // Wait for and verify success message or navigation
    await page.waitForSelector('.oxd-toast-content', { state: 'visible', timeout: 10000 });
    const successToast = page.locator('.oxd-toast-content-wrapper .oxd-toast-message');
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText('Successfully Saved', { timeout: 5000 });
  });
});