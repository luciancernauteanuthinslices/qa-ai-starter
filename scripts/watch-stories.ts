/**
 * Watch stories/*.yml|yaml|md → genereaza .feature si .spec.ts
 */
import chokidar from 'chokidar';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const STORIES_DIR = 'stories';
const FEATURES_DIR = 'features'; // optional, intermediar
const TESTS_DIR = 'tests/e2e';

[STORIES_DIR, FEATURES_DIR, TESTS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

function genFromStory(storyPath: string) {
  try {
    const base = path.basename(storyPath).replace(/\.(ya?ml|md)$/i, '');
    const featureOut = path.join(FEATURES_DIR, `${base}.feature`);
    const specOutDir = TESTS_DIR;

    // 1) story -> feature
    execSync(`tsx scripts/story_to_feature.ts "${storyPath}" --out "${featureOut}"`, { stdio: 'inherit' });

    // 2) feature -> playwright spec
    execSync(`tsx scripts/feature_to_playwright.ts "${featureOut}" --out "${specOutDir}" --lang ts`, { stdio: 'inherit' });

    console.log(`✅ Generated spec(s) from ${storyPath}`);
  } catch (e: any) {
    console.error(`❌ Generation failed for ${storyPath}\n`, e?.message ?? e);
  }
}

chokidar
  .watch(`${STORIES_DIR}/**/*.{yml,yaml,md}`, { ignoreInitial: false })
  .on('add', genFromStory)
  .on('change', genFromStory);

console.log(`👀 Watching ${STORIES_DIR} for new/changed stories...`);
