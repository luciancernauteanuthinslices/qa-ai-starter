import { Locator, Page, expect } from '@playwright/test';
import {DashboardPage} from '../pages/DashboardPage'


export default class LoginPage {
  username: Locator;
  password: Locator;
  loginButton: Locator;
  loginError: Locator;

  constructor(private page: Page) {
    this.username = this.page.getByRole('textbox', { name: 'Username' });
    this.password = this.page.getByRole('textbox', { name: 'Password' });
    this.loginButton = this.page.getByRole('button', { name: 'Login' });
    this.loginError = this.page.getByRole('alert', {name:'Invalid credentials'});
  }


  async goto(url:string) { await this.page.goto(url); }

  async doLogin(u: string , p: string) {
    await this.username.fill(u);
    await this.password.fill(p);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }
  
  // async assertLoggedIn() {
  //   await expect(this.page).toHaveURL(/\/web\/index\.php\/dashboard\/index\/?$/);
  //   await expect(new DashboardPage(this.page).heading).toBeVisible();
  // }

  async expectLoginError(){
    await expect(this.loginError).toBeVisible();
  }
}
