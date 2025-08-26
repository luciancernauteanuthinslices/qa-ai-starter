/**
 * Convert story YAML/MD -> .feature (Gherkin).
 * Usages:
 *   tsx scripts/story_to_feature.ts stories/US-001.yml --out features/US-001.feature
 *   tsx scripts/story_to_feature.ts stories --out features
 *   tsx scripts/story_to_feature.ts stories --out features --ai
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import 'dotenv/config';
import { prompt as aiPrompt } from '../ai/claudeAgent';

type Story = {
  id?: string;
  title?: string;
  feature?: string;
  role?: string;
  goal?: string;
  as_a?: string;
  i_want?: string;
  so_that?: string;
  acceptance?: string[];
  acceptance_criteria?: string[];
  notes?: string;
};

function toFeatureFallback(s: Story): string {
  const featureTitle = s.feature || s.title || s.id || 'Feature';
  const role = s.role || s.as_a || 'user';
  const goal = s.goal || s.i_want || 'the feature';
  const value = s.so_that || 'I achieve value';
  const bullets =
    (s.acceptance_criteria && s.acceptance_criteria.length ? s.acceptance_criteria : (s.acceptance ?? []));

  const lines: string[] = [];
  lines.push(`Feature: ${featureTitle}`);
  if (role || goal || value) lines.push(`  As a ${role}, I want ${goal} so that ${value}.`);
  lines.push('');
  
  // Create a single scenario with all acceptance criteria as steps
  if (bullets && bullets.length > 0) {
    lines.push(`  Scenario: ${featureTitle} workflow`);
    
    bullets.forEach((acc, idx) => {
      const step = acc.trim();
      if (step.toLowerCase().startsWith('given')) {
        lines.push(`    ${step}`);
      } else if (step.toLowerCase().startsWith('when')) {
        lines.push(`    ${step}`);
      } else if (step.toLowerCase().startsWith('and')) {
        lines.push(`    ${step}`);
      } else if (step.toLowerCase().startsWith('then')) {
        lines.push(`    ${step}`);
      } else {
        // Default to Given/When/Then based on position
        if (idx === 0) {
          lines.push(`    Given ${step}`);
        } else if (idx === bullets.length - 1) {
          lines.push(`    Then ${step}`);
        } else {
          lines.push(`    And ${step}`);
        }
      }
    });
  }
  
  return lines.join('\n');
}

function parseStory(raw: string, filePath: string): Story {
  if (/\.(md)$/i.test(filePath)) {
    const lines = raw.split(/\r?\n/);
    const feature = (lines.find(l => /^#\s+/.test(l)) || '# Feature').replace(/^#\s+/, '').trim();
    const acceptance = lines.filter(l => /^\s*[-*+]\s+/.test(l)).map(l => l.replace(/^\s*[-*+]\s+/, '').trim());
    return { feature, acceptance };
  }
  return YAML.parse(raw) as Story;
}

async function toFeatureAI(inputFile: string, raw: string): Promise<string> {
  const system = 'You are a senior QA who writes clean, valid Gherkin features.';
  const user = `
Transform the following story file into a single VALID Gherkin ".feature" file.

Rules:
- Output ONLY the .feature content (no explanations, no code fences).
- Start with "Feature: …".
- Use plain Gherkin keywords: Feature, Background (optional), Scenario, Given, When, Then, And.
- If story has: id, title, as_a, i_want, so_that, acceptance_criteria, use them faithfully.
- Keep scenarios atomic and readable. No invented flows.

Story file: ${path.basename(inputFile)}
----------------
${raw}
----------------
`;
  const { response } = await aiPrompt({ input: user, system, maxTokens: 4000 });
  return response.trim();
}

async function processFile(inputFile: string, outPath: string, useAI: boolean) {
  const raw = fs.readFileSync(inputFile, 'utf8');
  const featureText = useAI ? await toFeatureAI(inputFile, raw) : toFeatureFallback(parseStory(raw, inputFile));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, featureText, 'utf8');
  console.log(`📝 feature → ${outPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Usage: story_to_feature <file-or-folder> --out <file-or-folder> [--ai]');
    process.exit(1);
  }
  const src = args[0];
  const outIdx = args.indexOf('--out');
  const outArg = outIdx >= 0 ? args[outIdx + 1] : undefined;
  const useAI = args.includes('--ai');
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
      await processFile(inFile, outFile, useAI);
    }
  } else {
    await processFile(src, outArg, useAI);
  }
}

main().catch(err => {
  console.error('[story_to_feature] Failed:', err);
  process.exit(1);
});
