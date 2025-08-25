import { Locator, Page, expect } from '@playwright/test';

export class DashboardPage {
  heading:Locator;

  constructor(private page: Page) {
    this.heading = this.page.getByRole('heading', { name: /dashboard/i });
  }

  async assertHeading() {
    await expect(this.heading).toBeVisible();
  }
}
