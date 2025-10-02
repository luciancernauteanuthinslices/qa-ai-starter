# Slack Integration Setup Guide

## 🚀 Overview

The QA AI Pipeline now automatically sends comprehensive test reports to Slack when GitHub Actions completes. The integration includes:

- **Rich Slack attachments** with test results, status, and metrics
- **GitHub Actions integration** with run details and links
- **Automatic parsing** of AI-generated summaries
- **Support for both Slack and Teams** webhooks

## 📋 Setup Instructions

### 1. Create Slack Webhook

1. Go to your Slack workspace
2. Navigate to **Apps** → **Incoming Webhooks**
3. Click **Add to Slack**
4. Choose the channel for QA notifications
5. Copy the webhook URL (starts with `https://hooks.slack.com/services/`)

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository:

```
Repository Settings → Secrets and variables → Actions → New repository secret
```

**Required:**
- `SLACK_WEBHOOK` - Your Slack webhook URL

**Optional:**
- `TEAMS_WEBHOOK` - Microsoft Teams webhook URL (if using Teams)

### 3. Test Locally

```bash
# Set environment variable
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Test with default message
npm run notify

# Test with custom message
tsx scripts/send_slack.ts "Test message from local"

# Test with summary file
tsx scripts/send_slack.ts "Pipeline completed" reports/summaries/last.md
```

## 📊 Slack Message Format

### Message Structure
```
🤖 QA AI Pipeline Report - Run #123

┌─────────────────────────────────┐
│ QA Pipeline ✅ Passed           │
├─────────────────────────────────┤
│ Tests Passed: 15                │
│ Tests Failed: 0                 │
│ Total Tests: 15                 │
│ Triggered By: username          │
│ Branch: main                    │
│ View Details: GitHub Actions    │
└─────────────────────────────────┘

Summary content with AI analysis...
```

### Color Coding
- 🟢 **Green**: All tests passed
- 🔴 **Red**: Tests failed
- 🟡 **Yellow**: Unknown status or warnings

## 🔧 Customization Options

### Custom Messages
```bash
# Send custom notification
tsx scripts/send_slack.ts "Custom message" path/to/summary.md
```

### Environment Variables
```bash
SLACK_WEBHOOK=https://hooks.slack.com/services/...
TEAMS_WEBHOOK=https://outlook.office.com/webhook/...
GITHUB_RUN_NUMBER=123
GITHUB_REPOSITORY=user/repo
GITHUB_RUN_ID=456
GITHUB_ACTOR=username
GITHUB_REF_NAME=main
```

## 🧪 Testing the Integration

### Local Test
```bash
# Create test summary
mkdir -p reports/summaries
echo "# Test Summary
## Test Results
- **✅ Passed**: 10
- **❌ Failed**: 2
- **Total Tests**: 12

## Overall Status
❌ **TESTS FAILED** - Requires attention" > reports/summaries/last.md

# Send test notification
npm run notify
```

### GitHub Actions Test
1. Push changes to trigger the workflow
2. Check the Actions tab for the "Send Slack notification" step
3. Verify the message appears in your Slack channel

## 🔍 Troubleshooting

### Common Issues

**1. Webhook not working**
```bash
# Test webhook directly
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_SLACK_WEBHOOK_URL
```

**2. Summary file not found**
- Check if `reports/summaries/last.md` exists
- Verify the summarize script runs successfully
- Check file permissions

**3. GitHub Actions environment**
- Ensure `SLACK_WEBHOOK` secret is set
- Check the workflow logs for error messages
- Verify the notification step runs with `if: always()`

### Debug Mode
```bash
# Enable debug logging
DEBUG=1 tsx scripts/send_slack.ts
```

## 📈 Advanced Features

### Custom Slack App (Optional)
For more advanced features, create a custom Slack app:
1. Go to https://api.slack.com/apps
2. Create new app
3. Add bot token scopes: `chat:write`, `files:write`
4. Use OAuth token instead of webhook

### Teams Integration
The script also supports Microsoft Teams webhooks:
```bash
export TEAMS_WEBHOOK="https://outlook.office.com/webhook/..."
npm run notify
```

## 🎯 Workflow Integration

The Slack notification is automatically triggered in your CI pipeline:

1. **Tests run** → Generate logs
2. **Summary created** → AI analyzes results  
3. **Notification sent** → Slack receives formatted report
4. **Artifacts uploaded** → Full reports available

The notification runs with `if: always()` so you'll get reports even if tests fail.

## 📝 Message Examples

### Successful Pipeline
```
🤖 QA AI Pipeline Report - Run #45
✅ QA Pipeline Passed
Tests Passed: 25 | Tests Failed: 0 | Total Tests: 25
Triggered By: developer | Branch: feature/login-tests
View Details: GitHub Actions Run #45
```

### Failed Pipeline  
```
🤖 QA AI Pipeline Report - Run #46
❌ QA Pipeline Failed
Tests Passed: 20 | Tests Failed: 5 | Total Tests: 25
Triggered By: developer | Branch: main
View Details: GitHub Actions Run #46
```
