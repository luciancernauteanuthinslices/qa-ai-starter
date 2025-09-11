#!/usr/bin/env node
/**
 * Test MCP Integration - Demonstrates the enhanced features_to_specs_ai.ts capabilities
 * This script shows how the MCP integration processes feature files and generates tests
 */

import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'node:fs';
import path from 'node:path';

// Import types from the main script
type PageConfig = {
  url: string;
  name: string;
  description: string;
};

type PageUrlsConfig = {
  pages: PageConfig[];
  auth: { storageState: string };
  outputDir: string;
};

type MCPLocator = {
  selector: string;
  method: 'getByRole' | 'getByText' | 'getByLabel' | 'getByTestId' | 'locator';
  options?: Record<string, any>;
  verified: boolean;
  action?: 'click' | 'fill' | 'select' | 'hover' | 'check';
  description: string;
};

// Simulate MCP exploration results for demonstration
function simulateMCPExploration(): {
  pageObjects: Array<{
    name: string;
    url: string;
    locators: MCPLocator[];
    methods: string[];
  }>;
  verifiedLocators: MCPLocator[];
  explorationLog: string[];
} {
  const mockLocators: MCPLocator[] = [
    {
      selector: 'button',
      method: 'getByRole',
      options: { name: 'Profile' },
      verified: true,
      action: 'click',
      description: 'DashboardPage - Profile menu button'
    },
    {
      selector: 'Dashboard',
      method: 'getByText',
      verified: true,
      action: 'click',
      description: 'DashboardPage - Dashboard heading'
    },
    {
      selector: 'link',
      method: 'getByRole',
      options: { name: 'About' },
      verified: true,
      action: 'click',
      description: 'DashboardPage - About link in profile menu'
    },
    {
      selector: 'username',
      method: 'getByTestId',
      verified: true,
      action: 'fill',
      description: 'LoginPage - Username input field'
    }
  ];

  return {
    pageObjects: [
      {
        name: 'DashboardPage',
        url: 'https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index',
        locators: mockLocators.slice(0, 3),
        methods: ['clickProfile', 'clickDashboard', 'clickAbout']
      }
    ],
    verifiedLocators: mockLocators,
    explorationLog: [
      '🌐 Browser launched and context created',
      '🔍 Exploring DashboardPage: https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index',
      '✅ Discovered 3 interactive elements on DashboardPage',
      '📄 Generated page object for DashboardPage with 3 locators',
      '🔒 Browser closed'
    ]
  };
}

// Generate sample page object code
function generateSamplePageObject(pageObj: any): string {
  return `import { Locator, Page, expect } from '@playwright/test';

export default class ${pageObj.name}Page {
  private profileButton: Locator;
  private dashboardHeading: Locator;
  private aboutLink: Locator;

  constructor(private page: Page) {
    this.profileButton = this.page.getByRole('button', { name: 'Profile' });
    this.dashboardHeading = this.page.getByText('Dashboard');
    this.aboutLink = this.page.getByRole('link', { name: 'About' });
  }

  async clickProfile() {
    await this.profileButton.waitFor({ state: 'visible' });
    await this.profileButton.click();
  }

  async clickDashboard() {
    await this.dashboardHeading.waitFor({ state: 'visible' });
    await this.dashboardHeading.click();
  }

  async clickAbout() {
    await this.aboutLink.waitFor({ state: 'visible' });
    await this.aboutLink.click();
  }

  async assertPageVisible() {
    await expect(this.page).toHaveURL(new RegExp('dashboard'));
  }
}`;
}

// Generate sample test spec
function generateSampleTestSpec(): string {
  return `import { test, expect } from '@playwright/test';
import DashboardPagePage from '../../../pages/DashboardPage/DashboardPagePage';

test.use({ storageState: '.auth/admin.json' });

test('MCP Integration Demo - Dashboard Navigation', async ({ page }) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4200';
  await page.goto(baseUrl);
  await page.waitForLoadState('domcontentloaded');
  
  // Initialize MCP-generated page object
  const dashboardPage = new DashboardPagePage(page);
  await dashboardPage.assertPageVisible();
  
  // MCP-verified interactions for profile menu workflow
  await dashboardPage.clickProfile();
  
  // Wait for profile menu to appear
  await expect(page.getByRole('menu')).toBeVisible();
  
  // Navigate to About section
  await dashboardPage.clickAbout();
  
  // Verify navigation success
  await expect(page).toHaveURL(/.*about.*/);
  await expect(page.getByText('Application Information')).toBeVisible();
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach('screenshot', { 
      body: await page.screenshot(), 
      contentType: 'image/png' 
    });
  }
});`;
}

async function demonstrateIntegration() {
  console.log('🚀 MCP Integration Test - Processing Demo Feature\n');

  // 1. Load and analyze the demo feature file
  const featureFile = 'features/US-4-mcp-demo.feature';
  if (fs.existsSync(featureFile)) {
    console.log('📋 Step 1: Analyzing Feature File');
    const content = fs.readFileSync(featureFile, 'utf8');
    console.log(`✅ Loaded: ${featureFile}`);
    
    const pathMatch = content.match(/@path\(([^)]+)\)/);
    const hintMatch = content.match(/@hint\(([^)]+)\)/);
    
    if (pathMatch) console.log(`   📍 Target Path: ${pathMatch[1]}`);
    if (hintMatch) console.log(`   💡 Hint: ${hintMatch[1]}`);
  }

  // 2. Load page configuration
  console.log('\n🔧 Step 2: Loading Page Configuration');
  const configPath = 'scripts/page-urls.config.json';
  if (fs.existsSync(configPath)) {
    const config: PageUrlsConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(`✅ Loaded ${config.pages.length} page configurations`);
    
    const dashboardPage = config.pages.find(p => p.name.toLowerCase().includes('dashboard'));
    if (dashboardPage) {
      console.log(`   🎯 Found target page: ${dashboardPage.name} - ${dashboardPage.description}`);
    }
  }

  // 3. Simulate MCP exploration
  console.log('\n🔍 Step 3: MCP Exploration Results (Simulated)');
  const mcpResults = simulateMCPExploration();
  
  console.log('Exploration Log:');
  mcpResults.explorationLog.forEach(log => console.log(`   ${log}`));
  
  console.log(`\n📊 Discovery Summary:`);
  console.log(`   • Page Objects: ${mcpResults.pageObjects.length}`);
  console.log(`   • Verified Locators: ${mcpResults.verifiedLocators.length}`);
  console.log(`   • Action Methods: ${mcpResults.pageObjects.reduce((sum, po) => sum + po.methods.length, 0)}`);

  // 4. Generate sample outputs
  console.log('\n📄 Step 4: Generated Page Object Example');
  const samplePageObject = generateSamplePageObject(mcpResults.pageObjects[0]);
  
  // Ensure output directory exists
  const pageDir = 'pages/DashboardPage';
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }
  
  const pageObjectPath = path.join(pageDir, 'DashboardPagePage.ts');
  fs.writeFileSync(pageObjectPath, samplePageObject, 'utf8');
  console.log(`✅ Generated: ${pageObjectPath}`);

  // 5. Generate sample test spec
  console.log('\n🧪 Step 5: Generated Test Spec Example');
  const sampleTestSpec = generateSampleTestSpec();
  
  const testDir = 'tests/e2e/generated';
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testSpecPath = path.join(testDir, 'US-4-mcp-demo.spec.ts');
  fs.writeFileSync(testSpecPath, sampleTestSpec, 'utf8');
  console.log(`✅ Generated: ${testSpecPath}`);

  // 6. Summary
  console.log('\n✨ MCP Integration Test Complete!');
  console.log('\nGenerated Files:');
  console.log(`   📄 ${pageObjectPath}`);
  console.log(`   🧪 ${testSpecPath}`);
  
  console.log('\nNext Steps:');
  console.log('   1. Set up environment variables (BASE_URL, ANTHROPIC_API_KEY)');
  console.log('   2. Run: tsx scripts/features_to_specs_ai.ts --featuresDir features');
  console.log('   3. Execute tests: npx playwright test tests/e2e/generated/');
  
  console.log('\n🎯 The MCP integration provides:');
  console.log('   • Browser-verified locators for maximum reliability');
  console.log('   • Auto-generated page objects with consistent patterns');
  console.log('   • AI-enhanced test generation with real application context');
  console.log('   • Seamless integration with existing CI/CD pipeline');
}

// Run the demonstration
demonstrateIntegration().catch(console.error);
