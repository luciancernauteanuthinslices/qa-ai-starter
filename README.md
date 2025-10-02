# QA AI Starter

A comprehensive test automation framework that combines traditional QA practices with AI-powered test generation. This starter kit provides everything needed to build a modern quality assurance pipeline from story creation to automated testing and reporting.

## 🚀 Features

- **AI-Powered Test Generation**: Convert user stories to Gherkin features and Playwright specs using Claude AI
- **Multi-Layer Testing**: UI, API, visual regression, and performance testing
- **Intelligent Reporting**: Automated diff analysis, summaries, and KPI tracking  
- **CI/CD Integration**: GitHub Actions workflow with manual test suite selection
- **Notification System**: Slack/Teams webhook integration
- **Performance Monitoring**: k6 load testing with automated reporting
- **Visual Regression**: Screenshot comparison with pixel-perfect diff detection

Built with **Playwright**, **TypeScript**, and **Node.js** - runs locally and in CI environments.

---

## 📋 Prerequisites

### System Requirements
- **Node.js LTS** (>= 20.x) - [Download here](https://nodejs.org/)
- **Git** - For version control and CI/CD
- **Modern browser** - Chrome/Chromium (installed automatically by Playwright)

### Optional Tools
- **k6** - For performance testing ([Install guide](https://k6.io/docs/get-started/installation/))
- **Anthropic API Key** - For AI-powered test generation ([Get API key](https://console.anthropic.com/))

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd qa-ai-starter
   ```

2. **Install dependencies**
   ```bash
   npm install
   npx playwright install --with-deps
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings (see Environment section below)
   ```

4. **Verify installation**
   ```bash
   npm run demo
   ```

### Verification
After running `npm run demo`, you should see:
- ✅ UI tests executed successfully
- ✅ Visual regression baseline created
- ✅ Reports generated in `reports/` directory

---

## 🏗️ Project Structure

```
qa-ai-starter/
├── 📁 .github/workflows/     # CI/CD automation
│   └── ci.yml               # GitHub Actions pipeline
├── 📁 ai/                   # AI integration
│   └── claudeAgent.ts       # Claude AI client
├── 📁 features/             # Gherkin feature files (generated)
│   ├── US-1-login.feature
│   └── US-2-logout.feature
├── 📁 fixtures/             # Test setup and utilities
│   ├── global-setup.ts      # Authentication setup
│   └── test-extend.ts       # Custom test fixtures
├── 📁 pages/                # Page Object Models
│   ├── LoginPage.ts
│   └── DashboardPage.ts
├── 📁 reports/              # Test results and analysis
│   ├── api/                 # API diff reports
│   ├── performance/         # k6 performance results
│   ├── summaries/           # AI-generated summaries
│   └── ui/                  # Visual regression reports
├── 📁 sample-data/          # Test data and baselines
│   └── api/                 # API response samples
├── 📁 scripts/              # Automation and utility scripts
│   ├── features_to_specs_ai.ts    # AI-powered spec generation
│   ├── story_to_feature.ts        # Story to Gherkin conversion
│   ├── api_diff.ts                # API comparison tool
│   ├── summarize.ts               # Report summarization
│   └── k6/load_test.js            # Performance testing
├── 📁 stories/              # User stories (YAML format)
│   ├── US-1-login.yml
│   └── US-2-logout.yml
├── 📁 tests/                # Test specifications
│   ├── api/                 # API tests
│   └── e2e/                 # End-to-end UI tests
│       ├── regression/      # Regression test suites
│       ├── smoke/           # Smoke test suites
│       └── visual/          # Visual regression tests
├── 📁 utils/                # Shared utilities
│   ├── testData.ts          # Test data management
│   └── mockApi.ts           # API mocking utilities
├── 📁 visual-baseline/      # Screenshot baselines
├── .env.example             # Environment template
├── package.json             # Dependencies and scripts
├── playwright.config.ts     # Playwright configuration
└── tsconfig.json           # TypeScript configuration
```

### Key Directories

- **`stories/`** - YAML user stories that drive test generation
- **`features/`** - Auto-generated Gherkin feature files  
- **`tests/`** - Playwright test specifications (UI, API, visual)
- **`pages/`** - Page Object Models for maintainable UI tests
- **`scripts/`** - AI-powered automation and utility scripts
- **`reports/`** - Generated test reports, diffs, and summaries

---

## 🎯 Getting Started Guide

### 1. Basic UI Testing
Start with simple Playwright UI tests to verify your setup:
```bash
# Run smoke tests (fastest feedback)
npm run test:smoke

# Run all UI tests
npm run test:ui

# Run with debug mode
npm run test:ui:debug
```

### 2. AI-Powered Test Generation
Convert user stories into automated tests using AI:
```bash
# Convert YAML stories to Gherkin features
npm run ai:stories

# Generate Playwright specs from features using AI
npm run ai:specs:all

# Run the complete AI pipeline (stories → features → specs)
npm run pipeline:ai:all
```

### 3. Visual Regression Testing
Capture and compare screenshots for visual changes:
```bash
# Run visual regression tests
npm run test:visual

# Generate visual diff reports
npm run regression:ui
```

### 4. API Testing & Monitoring
Test and monitor API endpoints:
```bash
# Run API test suite
npm run test:api

# Compare API responses and generate diff reports
npm run diff:api
```

### 5. Performance Testing
Monitor application performance with k6:
```bash
# Run performance tests locally
npm run perf

# View performance reports in reports/performance/
```

### 6. Reporting & Analytics
Generate comprehensive test reports:
```bash
# Create summary reports (with AI insights if configured)
npm run report:summary

# Generate KPI and ROI reports
npm run report:kpi

# Send notifications to Slack/Teams
npm run notify "Test run completed"
```

### 7. Complete Demo Pipeline
Run the full testing pipeline:
```bash
# Execute complete demo (Generated spec + Smoke + UI + regression + reports + AI summary)
npm run demo
```

---

##  Environment (.env)

- `BASE_URL` – site under test (default uses https://example.com)
- `OPENAI_API_KEY` – optional, enables AI generation & summaries
- `OPENAI_MODEL` – optional, defaults to `gpt-4o-mini`
- `SLACK_WEBHOOK_URL` – optional (for Slack)
- `TEAMS_WEBHOOK_URL` – optional (for Microsoft Teams)
- `BASELINE_TEST_CASE_AUTHORING_MIN` – baseline minutes/test case (default 30)
- `AI_AUTOMATION_RATE` – percent (0–100) of test case authoring automated by AI (default 30)
- `K6_VUS`, `K6_DURATION` – performance test params

> If you don’t set `OPENAI_API_KEY`, the scripts still work with **rule-based** fallback logic.

---

## 🚀 CI/CD Integration (GitHub Actions)

The project includes a comprehensive GitHub Actions workflow that automatically:

### Automated Pipeline Features
- **AI Test Generation**: Converts stories to features and specs using Claude AI
- **Multi-Suite Testing**: Runs UI, API, visual regression, and performance tests
- **Smart Execution**: PRs run smoke tests, pushes run full test suite
- **Manual Control**: Workflow dispatch allows selecting specific test suites
- **Performance Monitoring**: k6 load testing on non-PR events
- **Intelligent Reporting**: Generates diffs, summaries, and KPI reports

### Workflow Configuration
```yaml
# Triggers
- Pull requests (smoke tests)
- Push to main/master (full suite)
- Scheduled runs (nightly regression)
- Manual dispatch (custom test selection)
```

### Required GitHub Secrets
```bash
ANTHROPIC_API_KEY    # For AI test generation
USERNAME             # Test application username (optional)
PASSWORD             # Test application password (optional)
```

### Optional GitHub Variables
```bash
BASE_URL             # Override default test URL
```

### Manual Workflow Dispatch
You can manually trigger the workflow with specific test suites:
- **All**: Complete test suite
- **Smoke**: Quick validation tests
- **UI**: User interface tests only
- **API**: API endpoint tests only
- **Visual**: Visual regression tests only

### Artifacts & Reports
Each run generates:
- Test execution reports
- Visual regression diffs
- Performance test results
- AI-generated summaries
- KPI and ROI metrics

Artifacts are retained for 7 days and can be downloaded from the Actions tab.

---

## 🆘 Support & Resources

### Getting Help
- **Code Documentation**: All scripts include detailed comments and examples
- **Test Examples**: Check `tests/` directory for implementation patterns
- **Page Objects**: Review `pages/` for maintainable UI test patterns
- **AI Scripts**: Examine `scripts/` for automation and AI integration examples

### Common Issues & Solutions

#### AI Generation Not Working
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API key permissions and quota
- Review error logs in CI/CD runs

#### Tests Failing in CI
- Ensure all required secrets are configured
- Check browser compatibility settings
- Verify base URL accessibility

#### Visual Regression Issues
- Update baselines after intentional UI changes
- Check screenshot resolution settings
- Review visual diff threshold configuration

#### Performance Test Problems
- Verify k6 installation for local runs
- Check target application load capacity
- Adjust VU count and duration settings

### Best Practices
- **Start Small**: Begin with smoke tests before full regression
- **Use Page Objects**: Maintain tests with the Page Object Model pattern
- **AI Iteration**: Refine AI prompts based on generated test quality
- **Regular Updates**: Keep dependencies and baselines current
- **Monitor Reports**: Review KPI trends for continuous improvement

### Contributing
- Follow TypeScript best practices
- Add tests for new functionality
- Update documentation for changes
- Use conventional commit messages

### Troubleshooting
For issues not covered here:
1. Check the `reports/` directory for detailed logs
2. Review GitHub Actions run details
3. Examine individual script outputs
4. Verify environment configuration
