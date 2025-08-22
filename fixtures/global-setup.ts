
// Logs in once with Admin and saves cookies → speeds up every test.
import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs'; import * as path from 'path';
import LoginPage from '../pages/LoginPage';
import * as dotenv from 'dotenv';
dotenv.config();

export default async function globalSetup(_: FullConfig) {
  const dir = path.resolve('.auth'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const user = process.env.USERNAME!;
  const password = process.env.PASSWORD!;
  const baseURL = process.env.BASE_URL!;

  

  const loginPage = new LoginPage(page);
console.log("Loaded BASE_URL:", process.env.BASE_URL);
  await loginPage.goto(baseURL!);
  await loginPage.doLogin(user, password);
  // await loginPage.assertLoggedIn();

  await page.context().storageState({ path: path.join(dir, 'admin.json') });
  await browser.close();
}

