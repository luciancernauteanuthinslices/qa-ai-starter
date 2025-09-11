import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage/LoginPage';

test('Sign-in attempt with incorrect password', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const baseUrl = 'https://opensource-demo.orangehrmlive.com/';

  // Act
  // Use explicit goto method from LoginPage
  await loginPage.goto(baseUrl);
  
  // Wait for page to load completely
  await page.waitForLoadState('networkidle');

  // Use method for invalid credentials login with dynamic data
  await loginPage.doLoginWithInvalidCredentials(
    process.env.USERNAME || 'Admin', 
    process.env.PASSWORD || 'admin123'
  );

  // Assert
  // Use multiple assertion strategies
  await loginPage.expectLoginError();
  
  // Additional robust validation
  await expect(loginPage.loginError).toBeVisible();
  await expect(loginPage.loginError).toHaveText('Invalid credentials');
  
  // Verify still on login page
  await loginPage.assertLoginHeading();
});