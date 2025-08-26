#!/usr/bin/env node
// Summarize a text log with or without AI
import fs from 'fs';
import 'dotenv/config';
import { prompt as aiPrompt } from '../ai/claudeAgent';

const [,, logPath='reports/test-run.log'] = process.argv;

function heuristicSummarize(text: string): string {
  const lines = text.split(/\r?\n/);
  const failed = lines.filter(l => /FAIL|Error|Exception/i.test(l)).length;
  const passed = lines.filter(l => /PASS|✓|passed/i.test(l)).length;
  const warnings = lines.filter(l => /WARN|Warning/i.test(l)).length;
  
  return `# Test Run Summary

## Overview
- **Total lines**: ${lines.length}
- **Passed**: ${passed}
- **Failed**: ${failed}
- **Warnings**: ${warnings}

## Status
${failed > 0 ? '❌ Tests failed' : passed > 0 ? '✅ All tests passed' : '⚠️ No clear test results found'}`;
}

async function summarizeWithAI(text: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.log('[AI] No ANTHROPIC_API_KEY found, using heuristic summary');
    return heuristicSummarize(text);
  }
  
  try {
    const systemPrompt = `You are a QA lead analyzing test execution logs. Provide a clear, actionable summary in markdown format.

Focus on:
- Overall test results (passed/failed counts)
- Key failures and their causes
- Performance insights if available
- Actionable recommendations for the team

Keep it concise but informative.`;

    const { response } = await aiPrompt({
      input: `Please analyze this test execution log and provide a summary:\n\n${text.slice(0, 12000)}`,
      system: systemPrompt,
      maxTokens: 1000
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
