#!/usr/bin/env node
// Summarize a text log with or without AI
import fs from 'fs';
import 'dotenv/config';
import { prompt as aiPrompt } from '../ai/claudeAgent';

const [,, logPath='reports/test-run.log'] = process.argv;

function heuristicSummarize(text: string): string {
  const lines = text.split(/\r?\n/);
  
  // Enhanced pattern matching for different test frameworks and outputs
  const passed = lines.filter(l => 
    /PASS|✓|passed|✅|PASSED|\s+\d+\s+passed/i.test(l) ||
    /\d+\s+passed/i.test(l)
  ).length;
  
  const failed = lines.filter(l => 
    /FAIL|Error|Exception|❌|FAILED|\s+\d+\s+failed/i.test(l) ||
    /\d+\s+failed/i.test(l)
  ).length;
  
  const warnings = lines.filter(l => /WARN|Warning|⚠️/i.test(l)).length;
  const skipped = lines.filter(l => /SKIP|skipped|⏭️/i.test(l)).length;
  
  // Extract test counts from Playwright output
  const testSummaryMatch = text.match(/(\d+)\s+passed.*?(\d+)\s+failed/i);
  const playwrightPassed = testSummaryMatch ? parseInt(testSummaryMatch[1]) : 0;
  const playwrightFailed = testSummaryMatch ? parseInt(testSummaryMatch[2]) : 0;
  
  // Extract performance metrics if available
  const performanceMetrics = extractPerformanceMetrics(text);
  
  const totalTests = Math.max(passed + failed, playwrightPassed + playwrightFailed);
  const actualPassed = Math.max(passed, playwrightPassed);
  const actualFailed = Math.max(failed, playwrightFailed);
  
  return `# QA Pipeline Summary

## Test Results
- **Total Tests**: ${totalTests || 'Unknown'}
- **✅ Passed**: ${actualPassed}
- **❌ Failed**: ${actualFailed}
- **⚠️ Warnings**: ${warnings}
- **⏭️ Skipped**: ${skipped}
- **📊 Total Log Lines**: ${lines.length}

## Overall Status
${actualFailed > 0 ? '❌ **TESTS FAILED** - Requires attention' : 
  actualPassed > 0 ? '✅ **ALL TESTS PASSED**' : 
  '⚠️ **NO CLEAR TEST RESULTS** - Check logs'}

${performanceMetrics ? `## Performance Metrics
${performanceMetrics}` : ''}

## Next Steps
${actualFailed > 0 ? '- Review failed test details\n- Check error logs\n- Fix failing tests' : 
  '- All tests passing\n- Ready for deployment'}`;
}

function extractPerformanceMetrics(text: string): string {
  const k6Metrics = text.match(/http_req_duration.*?avg=([0-9.]+[a-z]+)/i);
  const responseTime = k6Metrics ? k6Metrics[1] : null;
  
  const throughput = text.match(/http_reqs.*?(\d+\.?\d*\/s)/i);
  const requestRate = throughput ? throughput[1] : null;
  
  if (responseTime || requestRate) {
    return `- **Average Response Time**: ${responseTime || 'N/A'}
- **Request Rate**: ${requestRate || 'N/A'}`;
  }
  
  return '';
}

async function summarizeWithAI(text: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.log('[AI] No ANTHROPIC_API_KEY found, using heuristic summary');
    return heuristicSummarize(text);
  }
  
  try {
    const systemPrompt = `You are a QA lead analyzing comprehensive test execution logs from a CI/CD pipeline. Provide a detailed, actionable summary in markdown format.

Focus on:
- Overall test results with exact numbers (passed/failed/skipped)
- Test suite breakdown (generated tests, smoke, UI, API, visual, performance)
- Key failures and their root causes
- Performance metrics and bottlenecks
- Regression analysis results
- Actionable recommendations prioritized by impact
- Risk assessment for deployment

Structure your response with clear sections and use emojis for visual clarity.`;

    const { response } = await aiPrompt({
      input: `Please analyze this comprehensive QA pipeline execution log and provide a detailed summary. This log contains multiple test suites, performance data, and various reports:\n\n${text.slice(0, 15000)}`,
      system: systemPrompt,
      maxTokens: 1500
    });
    
    return response || heuristicSummarize(text);
  } catch (e: any) {
    console.error('[AI] Claude summarization failed, using heuristic.', e.message);
    return heuristicSummarize(text);
  }
}

async function run() {
  if (!fs.existsSync(logPath)) {
    console.log('No log file at', logPath, '- creating a sample.');
    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync(logPath, 'PASS example test\nFAIL another test - timeout\n✓ Login test passed\n❌ Dashboard test failed - element not found', 'utf8');
  }
  
  const text = fs.readFileSync(logPath, 'utf8');
  console.log(`📊 Analyzing log file: ${logPath} (${text.length} characters)`);
  
  const summary = await summarizeWithAI(text);
  
  // Ensure summaries directory exists
  if (!fs.existsSync('reports/summaries')) {
    fs.mkdirSync('reports/summaries', { recursive: true });
  }
  
  // Write both summary.md and last.md (for CI workflow)
  fs.writeFileSync('reports/summaries/summary.md', summary, 'utf8');
  fs.writeFileSync('reports/summaries/last.md', summary, 'utf8');
  
  console.log('✅ Wrote reports/summaries/summary.md');
  console.log('✅ Wrote reports/summaries/last.md');
}

run().catch(e => {
  console.error('❌ Summarization failed:', e.message);
  process.exit(1);
});
