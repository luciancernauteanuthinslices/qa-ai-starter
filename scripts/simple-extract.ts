import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

// Simple configuration
const config = {
  pages: [
    {
      url: 'https://example.com',
      name: 'ExamplePage',
      description: 'Example page for testing'
    }
  ],
  outputDir: 'pages'
};

async function main() {
  console.log('🚀 Starting locator extraction...');
  
  // Create output directory
  const outDir = path.resolve(process.cwd(), config.outputDir);
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`📁 Output directory: ${outDir}`);

  // Launch browser
  console.log('🌐 Launching browser...');
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 30000
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true
    });
    
    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    // Process each page
    for (const pageConfig of config.pages) {
      console.log(`\n🌐 Processing: ${pageConfig.name} (${pageConfig.url})`);
      
      try {
        // Navigate to page
        console.log('   Navigating...');
        const response = await page.goto(pageConfig.url, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        
        if (!response || !response.ok()) {
          console.warn(`⚠️  Page load may have issues. Status: ${response?.status()}`);
        }
        
        // Wait for network idle
        console.log('   Waiting for network idle...');
        await page.waitForLoadState('networkidle', { timeout: 10000 })
          .catch(() => console.log('   Network idle timeout, continuing...'));
        
        // Get page title
        const title = await page.title();
        console.log(`   Page title: ${title}`);
        
        // Create a simple page object
        const className = pageConfig.name.endsWith('Page') ? pageConfig.name : `${pageConfig.name}Page`;
        const filePath = path.join(outDir, `${className}.ts`);
        
        const content = `import { Page, expect } from '@playwright/test';

export default class ${className} {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('${pageConfig.url}');
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveTitle('${title.replace(/'/g, "\\'")}');
  }
}
`;
        
        // Save the page object
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Page object saved to: ${filePath}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${pageConfig.name}:`, error.message);
        
        // Take screenshot on error
        const screenshotPath = `error-${pageConfig.name.toLowerCase()}-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`   Screenshot saved to: ${screenshotPath}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    // Clean up
    console.log('\n🧹 Cleaning up...');
    await browser.close();
    console.log('✅ Done!');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
