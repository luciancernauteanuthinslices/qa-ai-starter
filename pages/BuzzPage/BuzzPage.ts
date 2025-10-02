import { Locator, Page, expect } from '@playwright/test';

/**
 * Page for writing and posting messages to Dashboard
 * Auto-generated with targeted locators from: https://opensource-demo.orangehrmlive.com/web/index.php/buzz/viewBuzz
 * Elements: 2 (optimized for feature requirements)
 */
export default class BuzzPage {
  whatsOnYourMind: Locator;
  dashboard: Locator;

  constructor(private page: Page) {
    this.whatsOnYourMind = this.page.getByPlaceholder('What\'s on your mind?');
    this.dashboard = this.page.getByRole('link', { name: 'Dashboard' });
  }

  // Navigation
  async navigate() {
    await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/buzz/viewBuzz');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Page Assertions
  async assertPageLoaded() {
    await expect(this.page).toHaveTitle('OrangeHRM')
  }

  // Element Actions & Assertions
  async fillWhatsOnYourMind(text: string) {
    await this.whatsOnYourMind.waitFor({ state: 'visible' });
    await this.whatsOnYourMind.fill(text);
  }

  async assertWhatsOnYourMindVisible() {
    await expect(this.whatsOnYourMind).toBeVisible();
  }

  async assertDashboardVisible() {
    await expect(this.dashboard).toBeVisible();
  }

  // Workflow Methods
  async createPost(message: string) {
    if (this.whatsOnYourMindTextarea) await this.fillWhatsOnYourMindTextarea(message);
    if (this.postButton) await this.clickPostButton();
    await this.page.waitForSelector('.oxd-buzz-post-container', { state: 'visible', timeout: 10000 });
  }
}
