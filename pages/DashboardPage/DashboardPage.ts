import { Locator, Page, expect } from '@playwright/test';

export class DashboardPage {
  heading:Locator;
  profileButton:Locator;
  logOut: Locator;
  about: Locator;
  aboutHeading: Locator;
  supportButton: Locator;
  supportHeading: Locator;
  changePassword: Locator;
  changePasswordHeading: Locator;
  

  constructor(private page: Page) {
    this.heading = this.page.getByRole('heading', { name: /dashboard/i });
    this.profileButton = this.page.getByRole('banner').getByRole('img', { name: 'profile picture' });
    this.logOut = this.page.getByRole('menuitem', { name: 'Logout' });
    this.about = this.page.getByRole('menuitem', { name: 'About' });
    this.aboutHeading = this.page.getByRole('heading', { name: 'About' });
    this.supportButton = this.page.getByRole('menuitem', { name: 'Support' });
    this.supportHeading = this.page.getByRole('heading', { name: 'Getting Started with OrangeHRM' });
    this.changePassword = this.page.getByRole('menuitem', { name: 'Change Password' });
    this.changePasswordHeading = this.page.getByRole('heading', { name: 'Update Password' });
  }

  async assertHeading() {
    await expect(this.heading).toBeVisible();
  }

  async logOutAction() {
    await this.profileButton.click();
    await this.logOut.click();
  }
  async aboutAction() {
    await this.profileButton.click();
    await this.about.click();
  }

  async assertAboutHeading() {
    await expect(this.aboutHeading).toBeVisible();
  }

  async supportAction() {
    await this.profileButton.click();
    await this.supportButton.click();
  }

  async assertSupportHeading() {
    await expect(this.supportHeading).toBeVisible();
  }
  async changePasswordAction() {
    await this.profileButton.click();
    await this.changePassword.click();
  }
  async assertChangePasswordHeading() {
    await expect(this.changePasswordHeading).toBeVisible();
  }
}
