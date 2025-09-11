# MCP Integration Guide for Playwright Test Generation

## Overview

The enhanced `features_to_specs_ai.ts` script now includes comprehensive MCP (Model Context Protocol) integration that provides:

- **Real-time browser automation** for locator discovery
- **Automatic page object generation** with verified selectors
- **AI-enhanced test generation** using actual application context
- **Seamless integration** with existing CI/CD pipeline

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Feature File  │───▶│   MCP Explorer   │───▶│  Generated Test │
│  (.feature)     │    │                  │    │   (.spec.ts)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Page Objects   │
                       │ (Auto-generated) │
                       └──────────────────┘
```

## Key Components

### 1. MCP Locator Discovery
- Launches Playwright browser in real-time
- Navigates to application pages from `page-urls.config.json`
- Discovers interactive elements (buttons, inputs, links)
- Validates selectors and determines optimal locator strategies
- Categorizes elements by action type (click, fill, select, check)

### 2. Page Object Generation
- Creates TypeScript classes with verified locators
- Generates action methods for each discovered element
- Includes assertion methods for page state validation
- Follows consistent naming conventions and structure

### 3. AI-Enhanced Test Generation
- Uses Claude AI with MCP exploration context
- Generates production-ready Playwright tests
- Includes proper error handling and screenshot capture
- Leverages existing page objects when available

## Usage Examples

### Basic Feature-to-Spec Generation
```bash
tsx scripts/features_to_specs_ai.ts --featuresDir features --outDir tests/e2e/generated
```

### Story-based Generation with MCP
```bash
tsx scripts/features_to_specs_ai.ts --story stories/US-1-login.yml --mcp
```

### Exploration Mode
```bash
tsx scripts/features_to_specs_ai.ts --featuresDir features --explore --mcp
```

## Configuration

### Page URLs Configuration (`scripts/page-urls.config.json`)
```json
{
  "pages": [
    {
      "url": "https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index",
      "name": "DashboardPage",
      "description": "Main dashboard page"
    },
    {
      "url": "https://opensource-demo.orangehrmlive.com/web/index.php/buzz/viewBuzz",
      "name": "Buzz",
      "description": "Page for writing messages to Dashboard"
    }
  ],
  "auth": {
    "storageState": ".auth/admin.json"
  },
  "outputDir": "pages"
}
```

### Feature File Tags
```gherkin
Feature: Dashboard Navigation
  @path(/web/index.php/dashboard/index)
  @hint(Use MCP to discover profile menu and navigation elements)
  
  Scenario: User navigates dashboard
    Given I am logged in and on the dashboard page
    When I interact with the profile menu
    Then I should see the expected navigation options
```

## Generated Output

### Auto-Generated Page Object
```typescript
// pages/DashboardPage/DashboardPage.ts
import { Locator, Page, expect } from '@playwright/test';

export default class DashboardPagePage {
  private element1: Locator;
  private element2: Locator;
  private element3: Locator;

  constructor(private page: Page) {
    this.element1 = this.page.getByRole('button', {"name":"Profile"});
    this.element2 = this.page.getByText('Dashboard');
    this.element3 = this.page.getByRole('link', {"name":"About"});
  }

  async clickProfile() {
    await this.element1.waitFor({ state: 'visible' });
    await this.element1.click();
  }

  async clickAbout() {
    await this.element3.waitFor({ state: 'visible' });
    await this.element3.click();
  }

  async assertPageVisible() {
    await expect(this.page).toHaveURL(new RegExp('dashboard'));
  }
}
```

### Generated Test Spec
```typescript
// tests/e2e/generated/US-4-mcp-demo.spec.ts
import { test, expect } from '@playwright/test';
import DashboardPagePage from '../../../pages/DashboardPage/DashboardPagePage';

test.use({ storageState: '.auth/admin.json' });

test('MCP Integration Demo', async ({ page }) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4200';
  await page.goto(baseUrl);
  await page.waitForLoadState('domcontentloaded');
  
  // Initialize MCP-generated page object
  const dashboardPagePage = new DashboardPagePage(page);
  await dashboardPagePage.assertPageVisible();
  
  // Use MCP-discovered interactions
  await dashboardPagePage.clickProfile();
  await dashboardPagePage.clickAbout();
  
  // Verify navigation
  await expect(page).toHaveURL(/.*about.*/);
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach('screenshot', { 
      body: await page.screenshot(), 
      contentType: 'image/png' 
    });
  }
});
```

## MCP Workflow

### Phase 1: Browser Exploration
1. **Launch Browser**: Starts Playwright with authentication context
2. **Navigate Pages**: Visits each configured page URL
3. **Discover Elements**: Finds interactive elements using multiple selector strategies
4. **Validate Selectors**: Tests each locator for visibility and interactability
5. **Categorize Actions**: Determines appropriate action methods (click, fill, etc.)

### Phase 2: Page Object Generation
1. **Create Classes**: Generates TypeScript page object classes
2. **Add Locators**: Includes verified selectors as private properties
3. **Generate Methods**: Creates action methods for each element
4. **Add Assertions**: Includes page state validation methods

### Phase 3: AI Test Generation
1. **Build Context**: Combines MCP results with feature requirements
2. **Generate Prompt**: Creates comprehensive prompt with exploration data
3. **AI Processing**: Uses Claude to generate production-ready test code
4. **Output Validation**: Ensures generated code follows best practices

## Benefits

### Reliability
- **Browser-verified locators** eliminate guesswork
- **Real-time validation** ensures elements are actually interactable
- **Smart selector strategy** reduces test flakiness

### Maintainability
- **Consistent page object patterns** across all generated classes
- **Verified action methods** that match actual application behavior
- **Comprehensive exploration logs** for debugging

### Productivity
- **Automated discovery** eliminates manual element inspection
- **Intelligent generation** understands application structure
- **Seamless integration** with existing workflows

## Troubleshooting

### Common Issues

1. **Browser Launch Fails**
   - Ensure Playwright browsers are installed: `npx playwright install`
   - Check authentication file exists: `.auth/admin.json`

2. **Page Navigation Errors**
   - Verify BASE_URL in `.env` file
   - Check page URLs in configuration are accessible

3. **AI Generation Issues**
   - Ensure ANTHROPIC_API_KEY is set in environment
   - Check Claude API quota and permissions

### Environment Setup
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Set up environment variables
echo "BASE_URL=https://opensource-demo.orangehrmlive.com" >> .env
echo "ANTHROPIC_API_KEY=your_api_key_here" >> .env

# Generate authentication state
npx playwright test auth.setup.ts
```

## Integration with CI/CD

The MCP-enhanced system integrates seamlessly with your existing GitHub Actions workflow:

```yaml
- name: Generate MCP-Enhanced Tests
  run: |
    npm run ai:specs:all
    # This now uses the MCP integration automatically
```

The generated tests follow the same patterns and can be executed with your existing test commands.
