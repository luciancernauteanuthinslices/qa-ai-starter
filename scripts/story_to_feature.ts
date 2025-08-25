/**
 * Transformă un YAML/MD simplu în .feature minimal (Gherkin-like).
 * Usage:
 *   tsx scripts/story_to_feature.ts stories/US-001.yml --out features/US-001.feature
 *   tsx scripts/story_to_feature.ts stories --out features
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

type Story = {
  feature: string;
  role?: string;
  goal?: string;
  acceptance?: string[]; // bullet list
};

function toFeature(s: Story): string {
  const lines: string[] = [];
  lines.push(`Feature: ${s.feature}`);
  if (s.role || s.goal) lines.push(`  As a ${s.role ?? 'user'}, I want ${s.goal ?? 'the feature'} so that I achieve value.`);
  lines.push('');
  (s.acceptance ?? []).forEach((acc, idx) => {
    lines.push(`  Scenario: ${acc}`);
    lines.push(`    Given I am on the application`);
    lines.push(`    When I perform: ${acc}`);
    lines.push(`    Then I should see a successful outcome`);
    if (idx < (s.acceptance!.length - 1)) lines.push('');
  });
  return lines.join('\n');
}

function processFile(inputFile: string, outPath: string) {
  const raw = fs.readFileSync(inputFile, 'utf8');
  let story: Story;
  if (/\.(md)$/i.test(inputFile)) {
    // very small MD fallback: first heading = feature; bullets = acceptance
    const lines = raw.split(/\r?\n/);
    const feature = (lines.find(l => /^#\s+/.test(l)) || '# Feature').replace(/^#\s+/, '').trim();
    const acceptance = lines.filter(l => /^\s*[-*+]\s+/.test(l)).map(l => l.replace(/^\s*[-*+]\s+/, '').trim());
    story = { feature, acceptance };
  } else {
    story = YAML.parse(raw) as Story;
  }
  const featureText = toFeature(story);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, featureText, 'utf8');
  console.log(`📝 feature → ${outPath}`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: story_to_feature <file-or-folder> --out <file-or-folder>');
  process.exit(1);
}
const src = args[0];
const outIdx = args.indexOf('--out');
const outArg = outIdx >= 0 ? args[outIdx + 1] : undefined;
if (!outArg) {
  console.error('Missing --out');
  process.exit(1);
}

const stat = fs.statSync(src);
if (stat.isDirectory()) {
  const outDir = outArg;
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    if (!/\.(ya?ml|md)$/i.test(f)) continue;
    const inFile = path.join(src, f);
    const outFile = path.join(outDir, f.replace(/\.(ya?ml|md)$/i, '.feature'));
    processFile(inFile, outFile);
  }
} else {
  processFile(src, outArg);
}
