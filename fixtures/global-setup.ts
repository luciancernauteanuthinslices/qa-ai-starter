
// Logs in once with Admin and saves cookies → speeds up every test.
import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables from .env file if it exists
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Loaded .env file from:', envPath);
}

// Use dynamic import for ESM compatibility
const loadLoginPage = async () => {
  try {
    const module = await import('../pages/LoginPage/LoginPage.js');
    return module.default;
  } catch (error) {
    console.error('Error loading LoginPage:', error);
    throw error;
  }
};

export default async function globalSetup(config: FullConfig) {
  // Load LoginPage dynamically
  const LoginPage = await loadLoginPage();
  console.log('LoginPage loaded successfully');
  const dir = path.resolve('.auth');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const user = process.env.USERNAME || 'admin';
    const password = process.env.PASSWORD || 'admin123';
    const baseURL = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com';

    console.log('Using credentials:', { user, baseURL });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto(baseURL);
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Perform login
    await loginPage.doLogin(user, password);
    
    // Wait for navigation to complete
    await page.waitForURL(/dashboard/);
    
    // Save storage state
    await page.context().storageState({ 
      path: path.join(dir, 'admin.json') 
    });
    
    console.log('Login successful, storage state saved');
  } catch (error) {
    console.error('Error during global setup:', error);
    // Save screenshot on error
    await page.screenshot({ path: 'global-setup-error.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

