#!/usr/bin/env tsx
/**
 * scripts/extract-locators.ts
 * Extracts interactive elements from pages and generates Page Object files.
 * If an MCP hints file is present, it **prioritises** MCP-verified selectors.
 *
 * Usage:
 *   tsx scripts/extract-locators.ts --config page-urls.config.json [--hints mcp-hints.json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium, Browser, Page } from 'playwright';

type PageCfg = { url: string; name?: string; description?: string };
type Config = {
  pages: PageCfg[];
  outputDir?: string;
  auth?: { storageState?: string };
};

type Hint = { kind: 'role'|'label'|'testid'|'id'|'text'; role?: string; name?: string; attr?: string; value?: string; score: number; };
type PageHints = { page: string; url: string; candidates: Hint[]; };
type HintsFile = { baseUrl: string; pages: PageHints[] };

function readArg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] || '') : fallback;
}

const CONFIG_PATH = readArg('config', 'page-urls.config.json');
const HINTS_PATH = readArg('hints', 'mcp-hints.json');
const BASE_URL = process.env.BASE_URL || readArg('baseUrl', 'http://localhost:3000');

function toAbsUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, BASE_URL).toString();
}

function loadMcpHints(hintsPath = 'mcp-hints.json'): HintsFile | null {
  const abs = path.resolve(process.cwd(), hintsPath);
  if (!fs.existsSync(abs)) return null;
  try { return JSON.parse(fs.readFileSync(abs, 'utf8')); } catch { return null; }
}
const MCP_HINTS = loadMcpHints(HINTS_PATH);

function slugify(s: string, max = 6) {
  return (s || 'target')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, max)
    .join('_');
}

function classNameFrom(pageNameOrUrl: string) {
  const base = pageNameOrUrl.replace(/https?:\/\/[^/]+/i, '').replace(/[^\w]+/g, ' ').trim() || 'Generic';
  return base.split(/\s+/).map(w => w[0]?.toUpperCase() + w.slice(1)).join('') + 'Page';
}

function preferMcpSelector(pageUrl: string, labelLike?: string) {
  if (!MCP_HINTS) return null;
  const entry = MCP_HINTS.pages.find(p => p.url === pageUrl);
  if (!entry) return null;

  const byStrength = (h: Hint) => ({ testid:5, role:4, label:3, id:2, text:1 }[h.kind] || 0) + (h.score || 0);
  let cands = entry.candidates;

  if (labelLike) {
    const rx = new RegExp(labelLike.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    cands = cands
      .map(c => ({ c, boost: (c.name && rx.test(c.name)) || (c.value && rx.test(c.value)) ? 0.2 : 0 }))
      .sort((a,b) => (byStrength(b.c) + b.boost) - (byStrength(a.c) + a.boost))
      .map(x => x.c);
  } else {
    cands = cands.sort((a,b) => byStrength(b) - byStrength(a));
  }

  const best = cands[0];
  if (!best) return null;

  if (best.kind === 'testid') {
    return `this.page.getByTestId(${JSON.stringify(best.value)})`;
  }
  if (best.kind === 'role' && best.role && (best.name || best.value)) {
    const name = best.name || best.value!;
    const safe = name.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
    return `this.page.getByRole(${JSON.stringify(best.role)}, { name: /${safe}/i })`;
  }
  if (best.kind === 'label' && best.value) {
    const safe = best.value.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
    return `this.page.getByLabel(/${safe}/i)`;
  }
  if (best.kind === 'id' && best.value) {
    return `this.page.locator(${JSON.stringify('#' + best.value)})`;
  }
  if (best.kind === 'text' && best.value) {
    const safe = best.value.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
    return `this.page.getByText(/${safe}/i)`;
  }
  return null;
}

async function extract() {
  console.log('Starting extract-locators script...');
  
  // Load config
  console.log(`Loading config from: ${CONFIG_PATH}`);
  const cfgAbs = path.resolve(process.cwd(), CONFIG_PATH);
  if (!fs.existsSync(cfgAbs)) {
    console.error(`❌ Config not found: ${cfgAbs}`);
    throw new Error(`Config not found: ${cfgAbs}`);
  }
  
  const cfg: Config = JSON.parse(fs.readFileSync(cfgAbs, 'utf8'));
  console.log(`Found ${cfg.pages.length} pages to process`);

  const outDir = path.resolve(process.cwd(), cfg.outputDir || 'pages');
  fs.mkdirSync(outDir, { recursive: true });

  // Launch Playwright
  const browser: Browser = await chromium.launch({ headless: true });
  const context = cfg.auth?.storageState
    ? await browser.newContext({ storageState: cfg.auth.storageState })
    : await browser.newContext();
  const page = await context.newPage();

  for (const p of cfg.pages) {
    const url = toAbsUrl(p.url);
    const friendly = p.name || url;
    const className = classNameFrom(p.name || url);
    const filePath = path.join(outDir, `${className}.ts`);

    console.log(`\n🌐 Visiting ${friendly} → ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Collect interactive elements
    const nodes = await page.$$eval(
      'button, a, input, select, textarea, [role="button"], [role="link"], [role="textbox"], [role="searchbox"], [role="switch"], [role="combobox"], [role="menuitem"], [role="tab"], [role="checkbox"], [role="radio"], [data-testid], [data-test], [data-qa], [data-cy]',
      (els) => {
        return els.slice(0, 1000).map((el: any) => {
          const tag = el.tagName?.toLowerCase?.() || '';
          const role = el.getAttribute?.('role') || '';
          const id = el.id || '';
          const testid = el.getAttribute?.('data-testid') || el.getAttribute?.('data-test') || el.getAttribute?.('data-qa') || el.getAttribute?.('data-cy') || '';
          const name = el.getAttribute?.('name') || '';
          const placeholder = el.getAttribute?.('placeholder') || '';
          const ariaLabel = el.getAttribute?.('aria-label') || '';
          const title = el.getAttribute?.('title') || '';
          const text = (el.textContent || '').trim();
          const href = el.getAttribute?.('href') || '';
          return { tag, role, id, testid, name, placeholder, ariaLabel, title, text, href };
        });
      }
    );

    // Build locator candidates
    type Cand = {
      label: string;
      kind: 'click'|'fill'|'expect';
      locator: string; // TS code snippet using page.*
      weight: number;
    };
    const cands: Cand[] = [];

    for (const n of nodes) {
      const label = n.ariaLabel || n.title || n.placeholder || n.text || n.name || n.id || n.href || '';
      if (!label) continue;

      const hinted = preferMcpSelector(url, label);

      // CLICKABLES
      if (['button','a'].includes(n.tag) || ['button','link','tab','menuitem','checkbox','radio'].includes(n.role)) {
        const loc = hinted
          || (n.testid ? `this.page.getByTestId(${JSON.stringify(n.testid)})`
              : n.role ? `this.page.getByRole(${JSON.stringify(n.role)}, { name: /${label.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}/i })`
              : n.ariaLabel ? `this.page.getByLabel(/${n.ariaLabel.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}/i)`
              : n.id ? `this.page.locator(${JSON.stringify('#' + n.id)})`
              : `this.page.getByText(/${label.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}/i)`);
        cands.push({ label, kind: 'click', locator: loc, weight: hinted ? 10 : (n.testid?9:n.role?8:n.ariaLabel?7:n.id?6:3) });
      }

      // INPUTS
      if (['input','textarea','select'].includes(n.tag) || ['textbox','combobox','searchbox'].includes(n.role)) {
        const loc = hinted
          || (n.testid ? `this.page.getByTestId(${JSON.stringify(n.testid)})`
              : n.placeholder ? `this.page.getByPlaceholder(/${n.placeholder.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}/i)`
              : n.ariaLabel ? `this.page.getByLabel(/${n.ariaLabel.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}/i)`
              : n.id ? `this.page.locator(${JSON.stringify('#' + n.id)})`
              : `this.page.getByRole('textbox')`);
        cands.push({ label, kind: 'fill', locator: loc, weight: hinted ? 10 : (n.testid?9:n.placeholder?8:n.ariaLabel?7:n.id?6:4) });
      }

      // EXPECT visible (headings/messages)
      if (n.text && n.text.length <= 80 && ['a','button'].indexOf(n.tag) === -1) {
        const loc = hinted || `this.page.getByText(/${n.text.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}/i)`;
        cands.push({ label: n.text, kind: 'expect', locator: loc, weight: hinted ? 8 : 2 });
      }
    }

    // De-dupe by (kind+locator) and keep top N
    const seen = new Set<string>();
    const top = cands
      .sort((a,b) => b.weight - a.weight)
      .filter(c => {
        const k = c.kind + '|' + c.locator;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 30);

    // Emit POM file
    const methods = top.map((c, i) => {
      const method = `${c.kind}_${slugify(c.label)}`;
      if (c.kind === 'click') return `
  async ${method}() {
    const el = ${c.locator};
    await el.click();
  }`.trim();
      if (c.kind === 'fill') return `
  async ${method}(value: string) {
    const el = ${c.locator};
    await el.fill(value);
  }`.trim();
      return `
  async ${method}() {
    const el = ${c.locator};
    await expect(el).toBeVisible();
  }`.trim();
    }).join('\n\n');

    const content = `import { Page, expect } from '@playwright/test';

export default class ${className} {
  constructor(private page: Page) {}

${methods || '  // No interactive elements discovered'}
}
`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Wrote POM → ${path.relative(process.cwd(), filePath)}`);
  }

  await page.close();
  await context.close();
  await browser.close();
}

extract().catch(err => {
  console.error('❌ extract-locators failed:', err);
  process.exit(1);
});
