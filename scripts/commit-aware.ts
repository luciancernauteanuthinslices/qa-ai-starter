/**
 * Propune taguri/arii de test in functie de git diff
 * Usage: tsx scripts/commit-aware.ts
 */
import { execSync } from 'node:child_process';
import map from './test-map.json' assert { type: 'json' };

const changed = execSync('git diff --name-only origin/main...HEAD', { stdio: ['ignore','pipe','pipe'] })
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

const tags = new Set<string>();
for (const f of changed) {
  for (const key of Object.keys(map)) {
    if (f.startsWith(key)) (map as any)[key].forEach((t: string) => tags.add(t));
  }
}
console.log(`Suggested tags: ${[...tags].join(' ') || '(none)'}`);
