# Playwright Locator Extractor

This script automates the extraction of locators from web pages and generates Page Object Model (POM) files. It's particularly useful for quickly setting up test automation frameworks.

## Features

- Extracts locators from web pages using Playwright
- Generates TypeScript Page Object Model files
- Supports authentication via Playwright's storage state
- Configurable through a JSON file
- Handles dynamic content and waits for page load

## Prerequisites

- Node.js 16+
- Playwright installed (`npx playwright install`)
- Authentication state file (`.auth/admin.json`)

## Installation

1. Make sure you have all dependencies installed:
   ```bash
   npm install
   npx playwright install
   ```

2. Ensure you have a valid authentication state file at `.auth/admin.json`.

## Configuration

Edit the `scripts/page-urls.config.json` file to specify which pages to process:

```json
{
  "pages": [
    {
      "url": "https://example.com/page",
      "name": "PageName",
      "description": "Description of what this page does"
    }
  ],
  "auth": {
    "storageState": ".auth/admin.json"
  },
  "outputDir": "../pages"
}
```

## Usage

1. Add the pages you want to extract locators from to the `page-urls.config.json` file.

2. Run the extractor:
   ```bash
   npm run extract:locators
   ```

3. The script will:
   - Open a browser window
   - Navigate to each URL in the config
   - Extract interactive elements
   - Generate Page Object files in the `pages` directory

## Generated Files

The script creates TypeScript files in the following structure:
```
pages/
  PageName/
    PageName.ts    # The generated Page Object
```

## Customization

### Locator Strategies

The script uses the following priority for generating locators:
1. `data-testid` attributes
2. `role` and `name` attributes for buttons and links
3. `placeholder` attributes for input fields
4. `aria-label` attributes
5. Text content as a fallback

### Page Object Template

You can modify the template in `extract-locators.ts` to include custom methods or change the structure of the generated files.

## Troubleshooting

- **Authentication Issues**: Ensure your `.auth/admin.json` file is valid and not expired.
- **Missing Locators**: Some dynamic content might not be captured. You may need to add manual waits or interactions.
- **Duplicate Locators**: The script tries to generate unique names, but you might need to manually adjust them in the generated files.

## Example

Here's an example of a generated Page Object:

```typescript
import { Locator, Page, expect } from '@playwright/test';

export default class LoginPage {
  // Locators
  private usernameInput: Locator;
  private passwordInput: Locator;
  private loginButton: Locator;

  constructor(private page: Page) {
    // Initialize locators
    this.usernameInput = this.page.getByPlaceholder('Username');
    this.passwordInput = this.page.getByPlaceholder('Password');
    this.loginButton = this.page.getByRole('button', { name: 'Login' });
  }

  // Navigation
  async navigate() {
    await this.page.goto('/web/index.php/auth/login');
    await this.assertPageIsLoaded();
  }
  
  // Assertions
  async assertPageIsLoaded() {
    await expect(this.page).toHaveTitle(/Login/);
  }
  
  // Actions
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

## Best Practices

1. **Review Generated Code**: Always review the generated Page Objects before using them in tests.
2. **Add Custom Methods**: Extend the generated classes with custom methods for common interactions.
3. **Update Selectors**: Replace generic selectors with more specific ones as needed.
4. **Version Control**: Commit the configuration file but not the generated Page Objects (add them to `.gitignore`).

## License

This script is part of the QA AI Starter Kit and follows the same licensing terms.
