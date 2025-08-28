# 🚀 K6 Performance Testing Integration

## Overview

The QA AI Pipeline now includes comprehensive performance testing using k6, with automatic integration into the CI/CD workflow, AI-powered analysis, and Slack notifications.

## 🎯 Features

### **Multi-Scenario Testing**
- **Smoke Test**: Basic functionality check (1 VU, 10s)
- **Load Test**: Normal usage simulation (5 VUs, 30s)
- **Stress Test**: Peak load testing (0→20 VUs, CI only)

### **Advanced Metrics**
- Custom metrics for login errors, dashboard load times
- Comprehensive thresholds with scenario-specific limits
- Real-time performance monitoring

### **AI Integration**
- Automatic summary generation with status analysis
- Integration with master-log.txt for AI summarization
- Performance data included in Slack notifications

## 📊 Test Configuration

### Environment Variables
```bash
# Basic configuration
BASE_URL=https://opensource-demo.orangehrmlive.com
K6_VUS=5                    # Number of virtual users
K6_DURATION=30s             # Test duration

# CI-specific (auto-configured)
GITHUB_ACTIONS=true         # Enables stress testing
GITHUB_RUN_NUMBER=123       # For tracking
GITHUB_REF_NAME=main        # Branch name
```

### Performance Thresholds
```javascript
thresholds: {
  http_req_failed: ['rate<0.05'],        // <5% errors
  http_req_duration: ['p(95)<1500'],     // 95% under 1.5s
  'http_req_duration{test_type:smoke}': ['p(95)<800'],  // Smoke faster
  checks: ['rate>0.95'],                 // >=95% checks pass
  login_errors: ['rate<0.02'],           // <2% login errors
  dashboard_load_time: ['p(90)<1000'],   // 90% dashboard <1s
}
```

## 🏃‍♂️ Running Tests

### Local Testing
```bash
# Basic load test
k6 run scripts/k6/load_test.js

# Custom configuration
K6_VUS=10 K6_DURATION=60s k6 run scripts/k6/load_test.js

# With specific environment
BASE_URL=https://your-app.com k6 run scripts/k6/load_test.js
```

### CI/CD Integration
Tests run automatically in GitHub Actions:
- **Pull Requests**: Skipped (to save resources)
- **Push to main**: Load test (5 VUs, 30s)
- **Scheduled runs**: Extended test (10 VUs, 60s)
- **Manual trigger**: Configurable via workflow_dispatch

## 📈 Test Scenarios

### 1. Smoke Test (10s)
```javascript
// Single user, basic functionality
- Login page access
- Dashboard access
- Basic response validation
```

### 2. Load Test (30s, starts at 10s)
```javascript
// Normal usage simulation
- Login page with form validation
- Dashboard with content checks
- Response time monitoring
- Random sleep patterns (1-3s)
```

### 3. Stress Test (40s, CI only)
```javascript
// Peak load simulation
- Multiple endpoint batch requests
- Ramping VU pattern (0→10→20→0)
- Shorter sleep intervals
- Additional endpoints testing
```

## 📋 Generated Reports

### Files Created
```
reports/performance/
├── k6-summary.txt          # Text summary
├── k6-summary.json         # Raw JSON data
├── k6-summary.md           # Markdown report
├── k6-raw.json            # Raw k6 output
└── master-log-append.txt   # For AI analysis
```

### Master Log Integration
Performance results are automatically appended to `reports/master-log.txt`:
```
## PERFORMANCE TEST RESULTS
Status: PASSED (✅)
Duration: 30s | VUs: 5 | Requests: 150
Response Time p95: 450ms | Error Rate: 0.00%
Checks: 150/150 passed (100.0%)
Throughput: 5.00 requests/second
All performance thresholds met ✅
```

## 🔔 Slack Integration

Performance metrics are included in Slack notifications:

### Successful Performance
```
🤖 QA AI Pipeline Report - Run #123
✅ QA Pipeline Passed

Tests Passed: 25    | Tests Failed: 0
Response Time (p95): 450ms
Error Rate: 0.00%   | Throughput: 5.0 req/s
Performance Status: ✅ Performance OK
```

### Performance Issues
```
🤖 QA AI Pipeline Report - Run #124
⚠️ QA Pipeline Warning

Tests Passed: 25    | Tests Failed: 0
Response Time (p95): 1800ms
Error Rate: 2.50%   | Throughput: 2.1 req/s
Performance Status: ❌ Performance Issues
```

## 🎛️ Customization

### Adding New Scenarios
```javascript
// In scripts/k6/load_test.js
scenarios: {
  your_scenario: {
    executor: 'constant-vus',
    vus: 3,
    duration: '45s',
    tags: { test_type: 'custom' },
    exec: 'yourScenarioFunction'
  }
}

export function yourScenarioFunction() {
  // Your test logic here
}
```

### Custom Metrics
```javascript
import { Rate, Trend, Counter } from 'k6/metrics';

const customErrors = new Rate('custom_errors');
const customTiming = new Trend('custom_timing');

// Use in test
customErrors.add(errorCondition);
customTiming.add(responseTime);
```

### Threshold Customization
```javascript
thresholds: {
  'custom_errors': ['rate<0.01'],
  'custom_timing': ['p(90)<500'],
  'http_req_duration{test_type:custom}': ['p(95)<1000']
}
```

## 🔍 Monitoring & Analysis

### Key Metrics to Watch
- **Response Time (p95)**: Should be <1500ms
- **Error Rate**: Should be <5%
- **Throughput**: Requests per second
- **Check Success Rate**: Should be >95%

### Performance Baselines
- **Login Page**: <800ms (p95)
- **Dashboard**: <1000ms (p90)
- **Overall Error Rate**: <2%
- **Check Success**: >99%

### Troubleshooting
```bash
# Debug k6 execution
k6 run --verbose scripts/k6/load_test.js

# Check specific metrics
k6 run --summary-trend-stats="min,med,avg,p(90),p(95),max" scripts/k6/load_test.js

# Output to different formats
k6 run --out json=debug.json --out csv=debug.csv scripts/k6/load_test.js
```

## 🚀 Best Practices

### Test Design
- Start with smoke tests for basic validation
- Use realistic user patterns in load tests
- Gradually increase load in stress tests
- Include think time between requests

### Threshold Setting
- Base thresholds on SLA requirements
- Use percentiles (p95, p99) over averages
- Set different thresholds per scenario
- Monitor trends over time

### CI/CD Integration
- Skip performance tests on PRs to save resources
- Run extended tests on scheduled builds
- Use environment-specific configurations
- Fail builds on performance regressions

### Monitoring
- Track performance trends over time
- Set up alerts for threshold violations
- Review performance reports regularly
- Correlate performance with deployments

## 📚 Resources

- [k6 Documentation](https://k6.io/docs/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/)
- [Grafana k6 GitHub Action](https://github.com/grafana/setup-k6-action)
- [k6 Metrics Reference](https://k6.io/docs/using-k6/metrics/)
