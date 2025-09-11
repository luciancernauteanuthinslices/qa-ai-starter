import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

// Types
interface PageConfig {
  url: string;
  name: string;
  description?: string;
}

interface Config {
  pages: PageConfig[];
  outputDir: string;
  auth?: {
    storageState?: string;
  };
}

// Utility functions
function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
    warn: '\x1b[33m', // Yellow
    reset: '\x1b[0m'  // Reset
  };
  
  const timestamp = new Date().toISOString();
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, 'success');
  }
}

async function extractLocators() {
  log('Starting locator extraction', 'info');
  
  // Load config
  const configPath = path.resolve(process.cwd(), 'scripts/page-urls.config.json');
  log(`Loading config from: ${configPath}`, 'info');
  
  if (!fs.existsSync(configPath)) {
    log(`Config file not found at: ${configPath}`, 'error');
    process.exit(1);
  }
  
  let config: Config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    log('Config loaded successfully', 'success');
  } catch (error) {
    log(`Failed to parse config file: ${error.message}`, 'error');
    process.exit(1);
  }
  
  // Ensure output directory exists
  const outputDir = path.resolve(process.cwd(), config.outputDir || 'pages');
  ensureDirectoryExists(outputDir);
  
  // Launch browser
  log('Launching browser...', 'info');
  const browser = await chromium.launch({
    headless: false,
    timeout: 30000
  });
  
  try {
    // Create browser context
    const contextOptions: any = {
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true
    };
    
    // Add storage state if available
    if (config.auth?.storageState) {
      const storagePath = path.resolve(process.cwd(), config.auth.storageState);
      if (fs.existsSync(storagePath)) {
        log(`Using authentication from: ${storagePath}`, 'info');
        contextOptions.storageState = storagePath;
      } else {
        log(`Warning: Storage state file not found: ${storagePath}`, 'warn');
      }
    }
    
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    
    // Process each page
    for (const [index, pageConfig] of config.pages.entries()) {
      const { url, name, description = '' } = pageConfig;
      const className = name.endsWith('Page') ? name : `${name}Page`;
      const pageDir = path.join(outputDir, className);
      ensureDirectoryExists(pageDir);
      const filePath = path.join(pageDir, `${className}.ts`);
      
      log(`\n[${index + 1}/${config.pages.length}] Processing: ${name} (${url})`, 'info');
      
      try {
        // Navigate to page
        log('  Navigating to page...', 'info');
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        
        if (!response || !response.ok()) {
          log(`  Warning: Page load may have issues. Status: ${response?.status()}`, 'warn');
        }
        
        // Wait for network idle
        log('  Waiting for network idle...', 'info');
        await page.waitForLoadState('networkidle', { timeout: 10000 })
          .catch(() => log('  Network idle timeout, continuing...', 'warn'));
        
        // Get page title
        const title = await page.title();
        log(`  Page title: ${title}`, 'success');
        
        // Generate page object content
        const content = `import { Page, expect } from '@playwright/test';

/**
 * ${description || `Page object for ${name}`}
 */
export default class ${className} {
  constructor(private page: Page) {}

  // Navigation
  async navigate() {
    await this.page.goto('${url}');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Assertions
  async assertPageLoaded() {
    await expect(this.page).toHaveTitle('${title.replace(/'/g, "\\'")}');
  }
}
`;
        
        // Save the page object
        fs.writeFileSync(filePath, content, 'utf8');
        log(`  Page object saved to: ${path.relative(process.cwd(), filePath)}`, 'success');
        
      } catch (error) {
        log(`  Error processing ${name}: ${error.message}`, 'error');
        
        // Take screenshot on error
        try {
          const screenshotPath = `error-${name.toLowerCase()}-${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
          log(`  Screenshot saved to: ${screenshotPath}`, 'warn');
        } catch (screenshotError) {
          log(`  Failed to take screenshot: ${screenshotError.message}`, 'error');
        }
      }
    }
    
    log('\n✅ Locator extraction completed successfully!', 'success');
    
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    // Clean up
    log('\nCleaning up...', 'info');
    await browser.close().catch(() => {
      log('Warning: Error while closing browser', 'warn');
    });
  }
}

// Run the script
process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error}`, 'error');
  process.exit(1);
});

extractLocators().catch((error) => {
  log(`Script failed: ${error.message}`, 'error');
  process.exit(1);
});
