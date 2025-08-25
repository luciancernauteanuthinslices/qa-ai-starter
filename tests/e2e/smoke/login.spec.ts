import { test, expect } from '@playwright/test';
import LoginPage  from '../../../pages/LoginPage';
import {DashboardPage}  from '../../../pages/DashboardPage';


const userName = process.env.USERNAME!;
const password = process.env.PASSWORD!;
const baseURL = process.env.BASE_URL!;
let loginPage: LoginPage;

test.use({ storageState: '.auth/admin.json' });

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.goto(baseURL);
});

test.describe('@smoke OrangeHRM Demo Admin Login', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('Successful login', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    // await loginPage.doLogin(userName, password);
    await dashboardPage.assertHeading();
  })
});