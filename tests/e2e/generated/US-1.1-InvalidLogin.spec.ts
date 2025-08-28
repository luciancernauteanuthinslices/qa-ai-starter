import { test } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';

test('Failed login with invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto(process.env.BASE_URL);
  await loginPage.assertLoginHeading();
  
  await loginPage.doLoginWithInvalidCredentials(
    process.env.USERNAME, 
    process.env.PASSWORD
  );
  
  await loginPage.expectLoginError();
});