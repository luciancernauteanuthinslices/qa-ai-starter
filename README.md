# QA + AI Starter (Beginner Friendly)

This repo is a hands-on starter so **someone with minimal QA experience** can execute the full 3‑month plan you requested.
It includes code + flows for:
- Test case generation (rule-based + optional AI via OpenAI)
- Playwright UI tests
- Visual regression diffs (pixelmatch)
- API JSON diff
- Auto-summaries (optional AI)
- Slack/Teams notifications (webhook)
- k6 performance test
- KPI/ROI report

> Everything runs locally with Node.js LTS (tested with 20.x).

---

## 0) Prerequisites

1. Install **Node.js LTS** (>= 20).
2. (Optional) Install **k6** from https://k6.io/ if you want to run performance tests.
3. Clone/extract this folder.
4. Copy `.env.example` to `.env` and adjust values.

```bash
cp .env.example .env
```

5. Install dependencies:
```bash
npm install
npx playwright install
```

6. Run the quick demo (UI test + diff + report):
```bash
npm run demo
```

---

## 1) Project Structure

```
qa-ai-starter/
  .env.example
  package.json
  playwright.config.js
  README.md
  .github/workflows/ci.yml
  stories/                  # User stories (YAML) to turn into .feature
    US-1-login.yml
  features/                 # Generated Gherkin .feature files
  tests/                    # Playwright specs (UI/API)
    e2e/
      example.spec.js
      visual.spec.js
    api/
      example.api.spec.js
  scripts/                  # Automation helpers
    story_to_feature.js
    feature_to_playwright.js
    run_regression_ui.js
    ui_diff.js
    api_diff.js
    summarize.js
    send_slack.js
    kpi_report.js
    k6/load_test.js
  baselines/                # Baseline screenshots
  screenshots/              # Current run screenshots
  reports/                  # Diffs, summaries, KPI/ROI
    ui/
    api/
    summaries/
    performance/
```

---

## 2) Beginner Flow (week-by-week shortcuts)

### Week 1 – Basic UI Test
```bash
# Runs a simple Playwright UI test against BASE_URL
npm run test:ui
```

### Week 2 – Generate Test Cases from Story
```bash
# Converts YAML user stories -> Gherkin .feature
npm run gen:feature
# Converts .feature -> Playwright spec scaffolds
npm run gen:spec
```

### Week 3 – Visual Regression
```bash
# Takes screenshots and diff vs baseline (pixelmatch)
npm run regression:ui
```

### Weeks 5–6 – Semi-automated pipeline story->feature->spec
```bash
npm run pipeline:story-to-spec
```

### Weeks 7–8 – API JSON diff + Slack/Teams notifications
```bash
# Compare two JSON files and produce a Markdown diff report
npm run diff:api -- sample-data/api/before.json sample-data/api/after.json
# Send a short message to Slack/Teams via webhook (optional)
npm run notify "Regression run finished"
```

### Week 9 – Auto-summarize logs (with/without AI)
```bash
npm run summarize reports/test-run.log
```

### Week 10 – Performance (k6)
```bash
npm run perf
```

### Week 11 – KPI/ROI report
```bash
npm run report:kpi
```

---

## 3) Environment (.env)

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

## 4) CI (GitHub Actions)

`.github/workflows/ci.yml` runs UI tests, regression diffs, summaries and KPI report on every push.

---

## 5) Support

Everything is commented and beginner-friendly. Open `scripts/` and `tests/` to learn by example.
