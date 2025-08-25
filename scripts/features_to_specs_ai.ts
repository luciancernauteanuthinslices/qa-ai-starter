#!/usr/bin/env node
/**
 * Batch-generate Playwright spec.ts files from ALL .feature files using your AI agent (Claude).
 *
 * Usage:
 *   tsx scripts/features_to_specs_ai.ts --featuresDir features --outDir tests/e2e --pagesDir pages --auth .auth/admin.json
 *   tsx scripts/features_to_specs_ai.ts --featuresDir features --outDir tests/e2e --assert
 *   tsx scripts/features_to_specs_ai.ts --featuresDir features --outDir tests/e2e --hint "Focus on topbar profile dropdown and logout"
 *
 * Optional per-feature tags inside .feature:
 *   @path(/web/index.php/dashboard/index)   # used to capture DOM/a11y for better locators
 *   @hint(Use the profile dropdown to logout)  # merged with --hint
 */

import * as dotenv from 'dotenv';
dotenv.config({ override: true }); // ensure .env wins over OS vars like USERNAME/PASSWORD

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { prompt as aiPrompt } from '../ai/claudeAgent';

// ------------------------ Flags & CLI helpers ------------------------

type Flags = {
  featuresDir: string;
  outDir: string;
  pagesDir: string;
  usePoms: boolean;
  auth?: string;
  assert?: boolean;
  hint?: string;
  maxHtml: number;
  maxA11y: number;
};

function getFlag(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function readFlags(): Flags {
  const featuresDir = getFlag('featuresDir') || 'features';
  const outDir = getFlag('outDir') || 'tests/e2e';
  const pagesDir = getFlag('pagesDir') || 'pages';
  const usePoms = hasFlag('noPoms') ? false : true; // default ON

  return {
    featuresDir,
    outDir,
    pagesDir,
    usePoms,
    auth: getFlag('auth'),
    hint: getFlag('hint'),
    assert: hasFlag('assert'),
    maxHtml: parseInt(getFlag('maxHtml') || '120000', 10),
    maxA11y: parseInt(getFlag('maxA11y') || '120000', 10),
  };
}

// ------------------------ FS helpers ------------------------

function ensureDirs(f: Flags) {
  if (!fs.existsSync(f.featuresDir)) throw new Error(`[ai] featuresDir not found: ${path.resolve(f.featuresDir)}`);
  if (!fs.existsSync(f.outDir)) fs.mkdirSync(f.outDir, { recursive: true });
  if (!fs.existsSync(f.pagesDir)) {
    console.warn(`[ai] pagesDir not found: ${path.resolve(f.pagesDir)} (proceeding without POMs)`);
  }
}

function readPoms(pagesDir: string, limit = 70_000) {
  if (!fs.existsSync(pagesDir)) return [];
  const files = fs.readdirSync(pagesDir).filter(f => /\.ts$/i.test(f));
  return files.map(file => {
    const full = path.join(pagesDir, file);
    const code = fs.readFileSync(full, 'utf8').slice(0, limit);
    return { file, code };
  });
}

function parseTag(text: string, tag: 'path' | 'hint'): string | undefined {
  const m = text.match(new RegExp(`@${tag}\\(([^)]+)\\)`, 'i'));
  return m?.[1]?.trim();
}

// ------------------------ Env handling ------------------------

/**
 * Auto-collect env variable NAMES to nudge the agent to reference process.env.*
 * We do NOT include values into the prompt (keep secrets safe).
 */
function collectEnvKeys(): string[] {
  const env = process.env as Record<string, string | undefined>;
  const keys = new Set<string>();

  // Common/safe candidates used in the project
  ['BASE_URL', 'ORANGEHRM_USERNAME', 'ORANGEHRM_PASSWORD', 'USERNAME', 'PASSWORD'].forEach(k => {
    if (env[k] !== undefined) keys.add(k);
  });

  // Project-prefixed patterns (optional)
  Object.keys(env).forEach(k => {
    if (k.startsWith('E2E_') || k.startsWith('PLAYWRIGHT_')) keys.add(k);
  });

  return Array.from(keys);
}

function buildEnvSummary(keys: string[]): string {
  if (!keys.length) {
    return 'Environment: (no known vars detected). If credentials/URLs are needed, reference them via process.env.* (do NOT inline).';
  }
  return `Environment variables available (use via process.env.NAME; never inline values):
- ${keys.join('\n- ')}`;
}

// ------------------------ Prompt builders ------------------------

function buildSystemPrompt(
  allowAssert: boolean,
  importBase: string,
  usePoms: boolean,
  envKeys: string[]
) {
  return [
    'You are a senior QA who writes clean, valid Playwright specs in TypeScript.',
    'Output only code (no explanations, no code fences).',
    'Follow Playwright best practices: no hard waits; rely on auto-waits.',
    'Selectors priority: getByTestId > getByRole({ name }) > getByLabel > getByText > stable CSS; avoid XPath.',
    'Use page.goto with a relative path so baseURL applies when navigation is needed.',
    'Create one test unless the feature clearly requires multiple scenarios.',
    allowAssert ? 'Assertions are allowed as needed.' : 'Do not add assertions unless explicitly asked.',
    'Keep code concise; do not comment each line.',
    envKeys.length
      ? `If any of [${envKeys.join(', ')}] are needed (e.g., credentials/URLs), always reference them via process.env.KEY (do NOT inline).`
      : 'If credentials/URLs are needed, assume they come from process.env.* and do NOT inline values.',
    usePoms
      ? `Prefer using existing Page Objects. Import them from "${importBase}/<FileNameWithoutExt>". Only fall back to raw locators if a required method/field does not exist.`
      : 'Ignore POMs.',
  ].join(' ');
}

function buildUserPrompt(
  featureText: string,
  dom: { html: string; a11y: string; title?: string; url?: string },
  extraHint: string | undefined,
  poms: { file: string; code: string }[] | undefined,
  envSummary: string
) {
  const head = [
    'Transform the following Gherkin feature into a single VALID Playwright spec.ts file.',
    "Use: import { test, expect } from '@playwright/test';",
    'If Page Objects are provided, import and use them.',
    'Prioritize getByRole() / getByText() / getByTestId() when writing raw steps.',
    'Leverage DOM context (if provided) to choose resilient selectors.',
    'Random data must be short and compact.',
    'Keep the code focused on the scenario steps.',
  ];
  if (extraHint) head.push(`Additional developer hint: ${extraHint}`);

  const nav = dom.url ? `DOM context URL: ${dom.url}\nPage title: ${dom.title}` : 'No live DOM context provided.';
  const pomBundle = poms?.length
    ? `Existing Page Objects (TypeScript, truncated for context):\n\n${poms.map(p => `// ${p.file}\n${p.code}`).join('\n\n')}`
    : '(No Page Objects provided)';

  return `
${head.join('\n')}

${envSummary}

${nav}

${pomBundle}

Accessibility snapshot (truncated JSON):
${dom.a11y || '(not available)'}

HTML (truncated):
${dom.html || '(not available)'}

Feature file content:
----------------
${featureText}
----------------
`.trim();
}

// ------------------------ DOM capture ------------------------

function absUrl(base: string, rel: string) {
  const u = new URL(base);
  return new URL(rel, u).toString();
}

async function captureDom(pathRel: string, auth?: string, maxHtml = 120000, maxA11y = 120000) {
  if (!process.env.BASE_URL) throw new Error('BASE_URL missing in .env; required to capture DOM context');
  const url = absUrl(process.env.BASE_URL, pathRel);
  const browser = await chromium.launch();
  const context = await browser.newContext(auth ? { storageState: auth } : {});
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const html = (await page.content()).slice(0, maxHtml);
  const a11yObj = await page.accessibility.snapshot({ interestingOnly: false }).catch(() => null);
  const a11y = a11yObj ? JSON.stringify(a11yObj).slice(0, maxA11y) : '';
  const title = await page.title();

  await browser.close();
  return { html, a11y, title, url };
}

// ------------------------ Generation per feature ------------------------

async function generateOne(
  featurePath: string,
  outDir: string,
  flags: Flags,
  importBase: string,
  bundledPoms: { file: string; code: string }[] | undefined,
  envKeys: string[],
  envSummary: string
) {
  const baseName = path.basename(featurePath).replace(/\.feature$/i, '');
  const outFile = path.join(outDir, `${baseName}.spec.ts`);
  const featureText = fs.readFileSync(featurePath, 'utf8');

  const tagPath = parseTag(featureText, 'path'); // e.g. @path(/web/index.php/dashboard/index)
  const tagHint = parseTag(featureText, 'hint'); // e.g. @hint(Use profile dropdown to logout)
  const mergedHint = [flags.hint, tagHint].filter(Boolean).join(' | ');

  let dom = { html: '', a11y: '', title: '', url: '' };
  if (tagPath) dom = await captureDom(tagPath, flags.auth, flags.maxHtml, flags.maxA11y);

  const system = buildSystemPrompt(!!flags.assert, importBase, flags.usePoms, envKeys);
  const user = buildUserPrompt(featureText, dom, mergedHint || undefined, flags.usePoms ? bundledPoms : undefined, envSummary);

  const { response } = await aiPrompt({ input: user, system, maxTokens: 3500 });

  // extract code if agent wrapped it in fences; otherwise use as-is
  const m = response.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  const code = (m && m[1] ? m[1] : response).trim();

  fs.writeFileSync(outFile, code, 'utf8');
  console.log(`✅ Spec generated: ${outFile}`);
}

// ------------------------ Main ------------------------

async function main() {
  const f = readFlags();
  ensureDirs(f);

  // import path base from output spec dir → pages dir (e.g., "../../pages")
  const importBase = path.relative(f.outDir, f.pagesDir).split(path.sep).join('/');
  const poms = f.usePoms ? readPoms(f.pagesDir) : [];

  // env names (no values) for the prompt
  const envKeys = collectEnvKeys();
  const envSummary = buildEnvSummary(envKeys);

  const files = fs
    .readdirSync(f.featuresDir)
    .filter(n => /\.feature$/i.test(n))
    .map(n => path.join(f.featuresDir, n));

  if (!files.length) {
    console.warn(`[ai] No .feature files found in ${path.resolve(f.featuresDir)}. Run story_to_feature first.`);
    process.exit(0);
  }

  for (const featureFile of files) {
    try {
      await generateOne(featureFile, f.outDir, f, importBase, poms, envKeys, envSummary);
    } catch (e: any) {
      console.error(`❌ Failed for ${path.basename(featureFile)}: ${e.message}`);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
