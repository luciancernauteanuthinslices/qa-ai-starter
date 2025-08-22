#!/usr/bin/env node
// Simple KPI/ROI calculator
import fs from 'fs';
import 'dotenv/config';

// Inputs
const baselineMinutes = Number(process.env.BASELINE_TEST_CASE_AUTHORING_MIN || 30); // per test case
const automationRate = Number(process.env.AI_AUTOMATION_RATE || 30); // % automated by AI
const testCasesGenerated = countGeneratedFeatures(); // number of .feature files
const regressionsFound = countLines('reports/ui_diff_report.md', /\| .* \| \d+ \|/g);

// Calculations
const minutesSaved = Math.round(testCasesGenerated * baselineMinutes * (automationRate / 100));
const hoursSaved = (minutesSaved / 60).toFixed(1);

// Report
const md = `# KPI / ROI Report

- Test cases generated: **${testCasesGenerated}**
- Baseline authoring time/test: **${baselineMinutes} min**
- AI automation rate: **${automationRate}%**
- Estimated minutes saved on authoring: **${minutesSaved} min** (~**${hoursSaved} h**)
- Visual regression diffs this run: **${regressionsFound}**

> Tweak env vars in .env to match your reality.
`;

fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/roi_report.md', md, 'utf8');
console.log('Wrote reports/roi_report.md');

function countGeneratedFeatures() {
  try {
    const files = fs.readdirSync('features').filter(f => f.endsWith('.feature'));
    return files.length;
  } catch { return 0; }
}

function countLines(file, regex) {
  try {
    const txt = fs.readFileSync(file, 'utf8');
    const m = txt.match(regex);
    return m ? m.length : 0;
  } catch { return 0; }
}
