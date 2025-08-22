#!/usr/bin/env node
// Summarize a text log with or without AI
import fs from 'fs';
import 'dotenv/config';

const [,, logPath='reports/test-run.log'] = process.argv;

function heuristicSummarize(text) {
  const lines = text.split(/\r?\n/);
  const failed = lines.filter(l => /FAIL|Error|Exception/i.test(l)).length;
  const passed = lines.filter(l => /PASS/i.test(l)).length;
  return `Summary:\n- Passed lines: ${passed}\n- Failed lines: ${failed}\n- Total lines: ${lines.length}`;
}

async function summarizeWithAI(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return heuristicSummarize(text);
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a QA lead. Summarize logs into clear bullets with actions.' },
          { role: 'user', content: text.slice(0, 12000) }
        ],
        temperature: 0.2
      })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || heuristicSummarize(text);
  } catch (e) {
    console.error('[AI] Summarization failed, using heuristic.', e.message);
    return heuristicSummarize(text);
  }
}

async function run() {
  if (!fs.existsSync(logPath)) {
    console.log('No log file at', logPath, '- creating a sample.');
    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync(logPath, 'PASS example test\nFAIL another test - timeout', 'utf8');
  }
  const text = fs.readFileSync(logPath, 'utf8');
  const summary = await summarizeWithAI(text);
  if (!fs.existsSync('reports/summaries')) fs.mkdirSync('reports/summaries', { recursive: true });
  fs.writeFileSync('reports/summaries/summary.md', summary, 'utf8');
  console.log('Wrote reports/summaries/summary.md');
}
run();
