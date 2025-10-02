import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(_: FullConfig) {
  // Clean up any temporary files or resources
  const dir = path.resolve('.auth');
  if (fs.existsSync(dir)) {
    // Optional: Remove the .auth directory if you want to clean up after tests
    // fs.rmSync(dir, { recursive: true, force: true });
  }
  
  console.log('Global teardown completed');
}

export default globalTeardown;
