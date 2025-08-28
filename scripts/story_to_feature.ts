/**
 * Convert story YAML -> .feature (Gherkin).
 * Usage: tsx scripts/story_to_feature.ts <input> --out <output> [--ai]
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import 'dotenv/config';
import { prompt as aiPrompt } from '../ai/claudeAgent';

type Story = {
  title?: string;
  feature?: string;
  as_a?: string;
  i_want?: string;
  so_that?: string;
  acceptance_criteria?: string[];
};

function toFeatureFallback(story: Story): string {
  const title = story.feature || story.title || 'Feature';
  const role = story.as_a || 'user';
  const goal = story.i_want || 'achieve the goal';
  const value = story.so_that || 'get value';
  const criteria = story.acceptance_criteria || [];

  const lines = [
    `Feature: ${title}`,
    `  As a ${role}, I want ${goal} so that ${value}.`,
    ''
  ];
  
  if (criteria.length > 0) {
    lines.push(`  Scenario: ${title} workflow`);
    
    criteria.forEach((step, idx) => {
      const trimmed = step.trim();
      const lower = trimmed.toLowerCase();
      
      if (lower.startsWith('given') || lower.startsWith('when') || 
          lower.startsWith('then') || lower.startsWith('and')) {
        lines.push(`    ${trimmed}`);
      } else {
        // Auto-assign Gherkin keywords based on position
        const keyword = idx === 0 ? 'Given' : 
                       idx === criteria.length - 1 ? 'Then' : 'And';
        lines.push(`    ${keyword} ${trimmed}`);
      }
    });
  }
  
  return lines.join('\n');
}

function parseStory(raw: string): Story {
  return YAML.parse(raw) as Story;
}

async function toFeatureAI(raw: string): Promise<string> {
  const system = 'You are a QA engineer who writes clean, valid Gherkin features.';
  const user = `Convert this story to a Gherkin feature file:

${raw}

Rules:
- Output ONLY the .feature content
- Use proper Gherkin: Feature, Scenario, Given, When, Then, And
- Create one scenario from acceptance_criteria
- Keep it simple and readable`;
  
  const { response } = await aiPrompt({ input: user, system, maxTokens: 2000 });
  return response.trim();
}

async function processFile(inputFile: string, outPath: string, useAI: boolean) {
  const raw = fs.readFileSync(inputFile, 'utf8');
  const featureText = useAI ? 
    await toFeatureAI(raw) : 
    toFeatureFallback(parseStory(raw));
  
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, featureText, 'utf8');
  console.log(`✅ ${path.basename(inputFile)} → ${path.basename(outPath)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const src = args[0];
  const outIdx = args.indexOf('--out');
  const output = args[outIdx + 1];
  const useAI = args.includes('--ai');
  
  if (!src || !output) {
    console.error('Usage: story_to_feature <input> --out <output> [--ai]');
    process.exit(1);
  }

  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(output, { recursive: true });
    const files = fs.readdirSync(src).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    
    for (const file of files) {
      const inputPath = path.join(src, file);
      const outputPath = path.join(output, file.replace(/\.ya?ml$/i, '.feature'));
      await processFile(inputPath, outputPath, useAI);
    }
  } else {
    await processFile(src, output, useAI);
  }
}

main().catch(err => {
  console.error('[story_to_feature] Failed:', err);
  process.exit(1);
});
