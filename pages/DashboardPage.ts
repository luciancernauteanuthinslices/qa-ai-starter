import { Locator, Page, expect } from '@playwright/test';

export class DashboardPage {
  heading:Locator;

  constructor(private page: Page) {
    const heading = this.page.getByRole('heading', { name: /dashboard/i });
  }

  async assertHeading() {
    await expect(this.page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  }
}
