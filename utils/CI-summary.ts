import * as fs from 'fs';
const json = JSON.parse(fs.readFileSync('playwright-report/report.json','utf-8'));
const total = json.suites?.[0]?.specs?.length ?? 0;
const failed = json.suites?.[0]?.specs?.filter((s:any)=>s.ok===false).length ?? 0;
const passed = total - failed;
const time = Math.round((json.duration/1000) || 0);
const out = `**Playwright**: ${passed}/${total} passed · ${failed} failed · ${time}s`;
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, out + '\n');
} else {
  console.log(out);
}