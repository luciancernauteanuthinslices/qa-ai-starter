import { Locator, Page, expect } from '@playwright/test';

/**
 * Page for Creating Dynamic Reports
 * Auto-generated with targeted locators from: https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewDefinedPredefinedReports
 * Elements: 1 (optimized for feature requirements)
 */
export default class PIMPage {
  dashboard: Locator;

  constructor(private page: Page) {
    this.dashboard = this.page.getByRole('link', { name: 'Dashboard' });
  }

  // Navigation
  async navigate() {
    await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewDefinedPredefinedReports');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Page Assertions
  async assertPageLoaded() {
    await expect(this.page).toHaveTitle('OrangeHRM')
  }

  // Element Actions & Assertions
  async assertDashboardVisible() {
    await expect(this.dashboard).toBeVisible();
  }
}
