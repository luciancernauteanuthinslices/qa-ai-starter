import { Locator, Page, expect } from '@playwright/test';
import {DashboardPage} from '../DashboardPage/DashboardPage'


export default class LoginPage {
  username: Locator;
  password: Locator;
  loginButton: Locator;
  loginError: Locator;
  loginHeading: Locator;

  constructor(private page: Page) {
    this.username = this.page.getByRole('textbox', { name: 'Username' });
    this.password = this.page.getByRole('textbox', { name: 'Password' });
    this.loginButton = this.page.getByRole('button', { name: 'Login' });
    this.loginError = this.page.getByText('Invalid credentials');
    this.loginHeading = this.page.getByRole('heading', { name: 'Login' });
  }


  async goto(url:string) { await this.page.goto(url); }

  async doLogin(u: string , p: string) {
    await this.username.fill(u);
    await this.password.fill(p);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async doLoginWithInvalidCredentials(u: string , p: string) {
    const rand = Date.now().toString();
    await this.username.fill(u+rand);
    await this.password.fill(p+rand);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }
  
  // async assertLoggedIn() {
  //   await expect(this.page).toHaveURL(/\/web\/index\.php\/dashboard\/index\/?$/);
  //   await expect(new DashboardPage(this.page).heading).toBeVisible();
  // }

  async expectLoginError(){
    await expect(this.loginError).toBeVisible();
  }

  async assertLoginHeading(){
    await expect(this.loginHeading).toBeVisible();
  }

}
