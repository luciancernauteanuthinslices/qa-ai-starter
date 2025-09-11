import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for better tracking
const loginErrors = new Rate('login_errors');
const dashboardLoadTime = new Trend('dashboard_load_time');
const totalRequests = new Counter('total_requests');

// Enhanced options with multiple scenarios
export const options = {
  scenarios: {
    // Smoke test - basic functionality
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '10s',
      tags: { test_type: 'smoke' },
    },
    // Load test - normal usage
    load: {
      executor: 'constant-vus', 
      vus: __ENV.K6_VUS || 5,
      duration: __ENV.K6_DURATION || '30s',
      tags: { test_type: 'load' },
      startTime: '10s',
    },
    // Stress test - peak usage (only in CI)
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 20 },
        { duration: '10s', target: 0 },
      ],
      tags: { test_type: 'stress' },
      startTime: '45s',
      exec: __ENV.GITHUB_ACTIONS ? 'stressTest' : undefined,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],        // <5% errors
    http_req_duration: ['p(95)<1500'],     // 95% under 1.5s
    'http_req_duration{test_type:smoke}': ['p(95)<800'],  // Smoke tests faster
    checks: ['rate>0.95'],                 // >=95% checks pass
    login_errors: ['rate<0.02'],           // <2% login errors
    dashboard_load_time: ['p(90)<1000'],   // 90% dashboard loads under 1s
  },
  tags: { 
    suite: 'performance', 
    service: 'orangehrm', 
    env: __ENV.GITHUB_REF_NAME || 'local',
    run_id: __ENV.GITHUB_RUN_NUMBER || 'dev'
  }
};

// Default scenario - basic load test
export default function () {
  const base = __ENV.BASE_URL || 'https://opensource-demo.orangehrmlive.com';
  
  group('Login Page Access', () => {
    const loginRes = http.get(`${base}/web/index.php/auth/login`);
    const loginOk = check(loginRes, {
      'login page loads': (r) => r.status === 200,
      'login page has form': (r) => String(r.body).includes('username'),
    });
    loginErrors.add(!loginOk);
    totalRequests.add(1);
  });
  
  group('Dashboard Access', () => {
    const startTime = Date.now();
    const dashRes = http.get(`${base}/web/index.php/dashboard/index`);
    const loadTime = Date.now() - startTime;
    
    const dashOk = check(dashRes, {
      'dashboard status 200': (r) => r.status === 200,
      'dashboard has content': (r) => String(r.body).includes('Dashboard') || String(r.body).includes('dashboard'),
      'response time acceptable': () => loadTime < 2000,
    });
    
    dashboardLoadTime.add(loadTime);
    totalRequests.add(1);
  });
  
  sleep(Math.random() * 2 + 1); // Random sleep 1-3s
}

// Stress test scenario - more intensive
export function stressTest() {
  const base = __ENV.BASE_URL || 'https://opensource-demo.orangehrmlive.com';
  
  group('Stress - Multiple Endpoints', () => {
    const responses = http.batch([
      ['GET', `${base}/web/index.php/auth/login`],
      ['GET', `${base}/web/index.php/dashboard/index`],
      ['GET', `${base}/web/index.php/pim/viewEmployeeList`],
    ]);
    
    responses.forEach((res, index) => {
      check(res, {
        [`endpoint ${index} status ok`]: (r) => r.status === 200 || r.status === 302,
      });
      totalRequests.add(1);
    });
  });
  
  sleep(0.5); // Shorter sleep for stress test
}

// Define the shape of our metrics
type MetricValue = {
  values: {
    [key: string]: any;
    count?: number;
    rate?: number;
    passes?: number;
    fails?: number;
    'p(95)'?: number;
  };
  thresholds?: {
    [key: string]: {
      ok: boolean;
    };
  };
};

type K6Data = {
  metrics: {
    [key: string]: MetricValue;
  };
  state: {
    testRunDurationMs: number;
  };
};

// Simplified summary - only export markdown
export function handleSummary(data: K6Data) {
  // Safely calculate max VUs
  const vuValues = data.metrics?.vus?.values || {};
  const vuNumbers = Object.values(vuValues).filter((v): v is number => typeof v === 'number');
  const totalVUs = vuNumbers.length > 0 ? Math.max(...vuNumbers) : 0;
  const totalDuration = Math.round(data.state.testRunDurationMs / 1000);
  const totalRequests = data.metrics.http_reqs?.values?.count || 0;
  const errorRate = (data.metrics.http_req_failed?.values?.rate || 0) * 100;
  const p95Duration = Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0);
  const checksPass = data.metrics.checks?.values?.passes || 0;
  const checksFail = data.metrics.checks?.values?.fails || 0;
  const checksRate = checksPass + checksFail > 0 ? (checksPass / (checksPass + checksFail) * 100) : 0;
  
  // Determine overall status
  const thresholdsPassed = Object.values(data.metrics)
    .filter(m => m.thresholds)
    .every(m => Object.values(m.thresholds).every(t => t.ok));
  
  const status = thresholdsPassed && errorRate < 5 && checksRate > 95 ? 'PASSED' : 'FAILED';
  const statusIcon = status === 'PASSED' ? '✅' : '❌';
  
  // Markdown summary
  const md = [
    '# 🚀 k6 Performance Test Summary',
    '',
    `**Status:** ${statusIcon} **${status}**`,
    `**Environment:** ${__ENV.BASE_URL || 'https://opensource-demo.orangehrmlive.com'}`,
    `**Duration:** ${totalDuration}s | **Max VUs:** ${totalVUs} | **Total Requests:** ${totalRequests}`,
    `**Run ID:** ${__ENV.GITHUB_RUN_NUMBER || 'local'} | **Branch:** ${__ENV.GITHUB_REF_NAME || 'dev'}`,
    '',
    '## 📊 Key Performance Metrics',
    `- **Response Time (p95):** ${p95Duration}ms`,
    `- **Error Rate:** ${errorRate.toFixed(2)}%`,
    `- **Checks Passed:** ${checksPass}/${checksPass + checksFail} (${checksRate.toFixed(1)}%)`,
    `- **Throughput:** ${(totalRequests / totalDuration).toFixed(2)} req/s`,
    '',
    '## 🎯 Threshold Results',
    Object.entries(data.metrics)
      .filter(([_, m]) => m.thresholds)
      .map(([name, m]) => {
        const results = Object.values(m.thresholds).map(t => t.ok ? '✅' : '❌').join(' ');
        const value = m.values?.rate !== undefined ? `${(m.values.rate * 100).toFixed(2)}%` :
                     m.values?.['p(95)'] !== undefined ? `${Math.round(m.values['p(95)'])}ms` :
                     m.values?.count !== undefined ? m.values.count.toString() : 'N/A';
        return `- **${name}**: ${results} (${value})`;
      })
      .join('\n') || '- No thresholds defined',
    '',
    '## 📈 Scenario Breakdown',
    Object.entries(data.metrics)
      .filter(([name]) => name.includes('http_req_duration{'))
      .map(([name, m]) => {
        const scenario = name.match(/test_type:([^}]+)/)?.[1] || 'default';
        const p95 = Math.round(m.values?.['p(95)'] || 0);
        return `- **${scenario.toUpperCase()}**: p95 = ${p95}ms`;
      })
      .join('\n') || '- Single scenario executed',
    '',
    status === 'FAILED' ? '## ⚠️ Performance Issues Detected\n- Review error rates and response times\n- Check application performance\n- Consider scaling resources\n' : '## ✅ Performance Targets Met\n- All thresholds passed\n- Application performing within acceptable limits\n',
    '---',
    `*Generated at: ${new Date().toISOString()}*`
  ].join('\n');
  
  return {
    'reports/performance/k6-summary.md': md
  };
}
