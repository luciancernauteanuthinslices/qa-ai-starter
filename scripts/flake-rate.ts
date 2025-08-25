/**
 * Calculeaza flake rate din playwright-report/report.json
 * Flaky = test care a trecut dupa cel putin un retry
 */
import fs from 'node:fs';

type Any = any;
const reportPath = 'playwright-report/report.json';
if (!fs.existsSync(reportPath)) {
  console.error(`Missing ${reportPath}. Run tests with JSON reporter.`);
  process.exit(1);
}
const r: Any = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

let total = 0, flaky = 0, failed = 0;
const slow: { name: string; dur: number }[] = [];

function specDuration(spec: Any): number {
  const d = spec.tests?.reduce((acc: number, t: Any) => {
    const td = t.results?.reduce((a:number, res:Any) => a + (res.duration ?? 0), 0) ?? 0;
    return acc + td;
  }, 0) ?? 0;
  return d;
}

for (const s of r.suites?.[0]?.specs ?? []) {
  total++;
  const hadRetry = s.tests?.some((t: Any) => (t.results ?? []).some((res: Any) => !!res.retry));
  const ok = !!s.ok;
  if (ok && hadRetry) flaky++;
  if (!ok) failed++;
  slow.push({ name: s.title ?? 'spec', dur: specDuration(s) });
}

slow.sort((a,b) => b.dur - a.dur);
const top3 = slow.slice(0,3).map(s => `${s.name} (${Math.round(s.dur/1000)}s)`).join(', ');

const rate = total ? (flaky / total) * 100 : 0;
console.log(`Flake rate: ${rate.toFixed(2)}% (${flaky}/${total}) | failed: ${failed} | slowest: ${top3}`);
