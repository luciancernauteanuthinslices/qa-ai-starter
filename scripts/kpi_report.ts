#!/usr/bin/env tsx
/**
 * Simple KPI / ROI calculator (TypeScript version)
 *
 * Usage:
 *   npx tsx scripts/kpi_report.ts
 */
import fs from "node:fs";
import "dotenv/config";

const baselineMinutes: number = Number(process.env.BASELINE_TEST_CASE_AUTHORING_MIN || 30); // per test case
const automationRate: number = Number(process.env.AI_AUTOMATION_RATE || 30); // % automated by AI

const testCasesGenerated: number = countGeneratedFeatures(); // number of .feature files
const regressionsFound: number = countLines("reports/ui_diff_report.md", /\| .* \| \d+ \|/g);

// Calculations
const minutesSaved: number = Math.round(
  testCasesGenerated * baselineMinutes * (automationRate / 100)
);
const hoursSaved: string = (minutesSaved / 60).toFixed(1);

// Report
const md = `# KPI / ROI Report

- Test cases generated: **${testCasesGenerated}**
- Baseline authoring time/test: **${baselineMinutes} min**
- AI automation rate: **${automationRate}%**
- Estimated minutes saved on authoring: **${minutesSaved} min** (~**${hoursSaved} h**)
- Visual regression diffs this run: **${regressionsFound}**

> Tweak env vars in .env to match your reality.
`;

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/roi_report.md", md, "utf8");
console.log("✅ Wrote reports/roi_report.md");

// ---------------- helpers ----------------

function countGeneratedFeatures(): number {
  try {
    const files = fs.readdirSync("features").filter((f) => f.endsWith(".feature"));
    return files.length;
  } catch {
    return 0;
  }
}

function countLines(file: string, regex: RegExp): number {
  try {
    const txt = fs.readFileSync(file, "utf8");
    const matches = txt.match(regex);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}
