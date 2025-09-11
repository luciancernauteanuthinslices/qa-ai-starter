#!/usr/bin/env tsx
/**
 * scripts/generate-testplan.ts
 * Generates a Markdown Test Plan using your existing AI agent (ai/claudeAgent),
 * seeded with an explicit Clinical Net domain brief so wording and structure
 * stay consistent across runs.
 *
 * Usage:
 *   tsx scripts/generate-testplan.ts
 *   tsx scripts/generate-testplan.ts --featuresDir features --out docs/TestPlan.md --project "Clinical Net" --maxTokens 12000
 *
 * Notes:
 * - Idempotent: replaces only the AUTOGEN block if the file already exists.
 * - Reads .env* files; includes explicit environment table (Local/Dev/Preprod/Prod).
 * - Scans .feature files to map features/scenarios into suites/tags.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

type Flags = {
  featuresDir: string;
  out: string;
  project: string;
  baseUrl?: string;
  envGlobs: string[];
  maxTokens: number;
  agent?: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

function readFlags(): Flags {
  const args = process.argv.slice(2);
  const get = (k: string, def?: string) => {
    const i = args.findIndex(a => a === `--${k}`);
    return i !== -1 ? (args[i + 1] || '') : def;
  };
  return {
    featuresDir: get('featuresDir', 'features') || 'features',
    out: get('out', 'docs/TestPlan.md') || 'docs/TestPlan.md',
    project: get('project', 'qa-ai-starter') || 'qa-ai-starter',
    baseUrl: get('baseUrl', process.env.BASE_URL),
    envGlobs: (get('envGlobs', '.env,.env.local,') || '')
      .split(',').map(s => s.trim()).filter(Boolean),
    maxTokens: Number(get('maxTokens', '8000')),
    agent: get('agent'),
  };
}

// ---------- FS helpers ----------
function globFiles(dirOrFile: string, ext: string): string[] {
  const p = path.resolve(cwd, dirOrFile);
  if (!fs.existsSync(p)) return [];
  const s = fs.statSync(p);
  if (s.isFile()) return p.endsWith(ext) ? [p] : [];
  const out: string[] = [];
  function walk(d: string) {
    for (const name of fs.readdirSync(d)) {
      const full = path.join(d, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (full.toLowerCase().endsWith(ext)) out.push(full);
    }
  }
  walk(p);
  return out;
}

function readEnvFiles(envGlobs: string[]) {
  const found: { file: string; vars: Record<string, string> }[] = [];
  for (const f of envGlobs) {
    const abs = path.resolve(cwd, f);
    if (fs.existsSync(abs)) {
      try {
        const content = fs.readFileSync(abs, 'utf8');
        const parsed = dotenv.parse(content);
        found.push({ file: path.relative(cwd, abs), vars: parsed });
      } catch (error) {
        console.warn(`Warning: Could not parse ${f}:`, error);
      }
    }
  }
  const processVars: Record<string, string> = {};
  ['BASE_URL','ENV','ENVIRONMENT','HEADLESS','OPENAI_API_KEY','ANTHROPIC_API_KEY'].forEach(k => {
    if (process.env[k]) processVars[k] = String(process.env[k]);
  });
  if (Object.keys(processVars).length) found.push({ file: '(process.env)', vars: processVars });
  return found;
}

// ---------- Feature parsing ----------
type FeatureSummary = {
  file: string;
  feature: string;
  tags: string[];
  scenarios: { name: string; tags: string[] }[];
};

function parseFeature(file: string): FeatureSummary {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  let feature = path.basename(file);
  const tagsTop: string[] = [];
  const scenarios: FeatureSummary['scenarios'] = [];
  let pendingTags: string[] = [];
  for (const line of lines) {
    const mFeature = line.match(/^\s*Feature:\s*(.+)\s*$/i);
    if (mFeature) feature = mFeature[1].trim();

    const mTags = line.match(/^\s*@([A-Za-z0-9_\-][^\s]*)/g);
    if (mTags) {
      const t = line.trim().split(/\s+/).filter(x => x.startsWith('@')).map(x => x.replace(/^@/, ''));
      pendingTags = t;
      if (!scenarios.length) tagsTop.push(...t);
    }

    const mSc = line.match(/^\s*Scenario(?: Outline)?:\s*(.+)\s*$/i);
    if (mSc) {
      scenarios.push({ name: mSc[1].trim(), tags: pendingTags });
      pendingTags = [];
    }
  }
  return {
    file: path.relative(cwd, file),
    feature,
    tags: Array.from(new Set(tagsTop)),
    scenarios,
  };
}

function summarizeFeatures(featureFiles: string[]): FeatureSummary[] {
  return featureFiles.map(parseFeature);
}

function mdEscape(s: string) {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- AI Agent adapter ----------
let FLAGS: Flags;
async function callAgent(system: string, input: string, maxTokens: number): Promise<string> {
  let aiPrompt: any;
  const agentPaths = FLAGS.agent ? 
    [path.isAbsolute(FLAGS.agent) ? FLAGS.agent : path.join(cwd, FLAGS.agent)] :
    [
      path.join(cwd, 'ai/claudeAgent.ts'),
      path.join(cwd, 'ai/claudeAgent.js'),
      path.join(cwd, 'src/ai/claudeAgent.ts'),
      path.join(cwd, 'src/ai/claudeAgent.js'),
      path.join(__dirname, '../ai/claudeAgent.ts'),
      path.join(__dirname, '../ai/claudeAgent.js')
    ];

  for (const agentPath of agentPaths) {
    try {
      // Convert file path to file URL for proper ES module import
      const fileUrl = `file://${agentPath.replace(/\\/g, '/')}`;
      const module = await import(fileUrl);
      aiPrompt = module.prompt;
      if (aiPrompt) break;
    } catch (e) {
      // Continue to next path
    }
  }

  if (!aiPrompt) {
    throw new Error(`Unable to import AI agent. Tried paths: ${agentPaths.join(', ')}. Use --agent to set a custom path.`);
  }

  try {
    const result = await aiPrompt({
      system,
      input,
      maxTokens
    });
    return String(result.response || result || '');
  } catch (error) {
    throw new Error(`AI agent call failed: ${error}`);
  }
}

// ---------- Main ----------
async function main() {
  FLAGS = readFlags();

  const featureFiles = globFiles(FLAGS.featuresDir, '.feature');
  const featureSummary = summarizeFeatures(featureFiles);
  const envs = readEnvFiles(FLAGS.envGlobs);

  // OrangeHRM explicit domain brief (kept concise but authoritative)
  const orangeHRMBrief = {
    productName: "OrangeHRM",
    description: "Human Resource Management system that enables organizations to manage employee information, leave requests, time tracking, performance evaluations, and administrative tasks through role-based access control.",
    roles: [
      "Admin — full system access, user management, configuration, reports",
      "ESS (Employee Self Service) — view personal info, apply for leave, timesheets",
      "Supervisor — manage team members, approve leave requests, view reports",
      "HR Manager — employee management, recruitment, performance reviews"
    ],
    keyFunctionalAreas: [
      "Employee Information Management (PIM)",
      "Leave Management (apply, approve, track leave requests)",
      "Time & Attendance (timesheets, work schedules)",
      "Admin panel (user management, system configuration)",
      "Dashboard & reporting (employee metrics, leave summaries)",
      "Authentication & role-based access control",
      "Multi-module navigation and workflow management"
    ],
    testingApproach: [
      "AI-powered test generation from user stories to Gherkin features to Playwright specs",
      "Automated Playwright tests for critical HR workflows",
      "Page Object Model (POM) pattern for maintainable test automation",
      "Visual regression testing and performance monitoring",
      "API testing for backend service validation"
    ],
    scopeFunctional: [
      "Authentication & Authorization (login/logout, role-based access, session management)",
      "Employee Management (add/edit/search employees, personal information)",
      "Leave Management (apply for leave, approval workflows, leave balance tracking)",
      "Time Management (timesheets, attendance tracking, work schedules)",
      "Admin Functions (user management, system configuration, organizational setup)",
      "Dashboard & Navigation (sidebar navigation, dashboard widgets, profile management)",
      "Reports & Analytics (employee reports, leave summaries, time tracking reports)",
      "System Information & Support (about system, help documentation)"
    ],
    nonFunctional: {
      performance: "Page load ≤ 3s, form submission ≤ 2s",
      security: "Role-based access control, secure authentication, data privacy",
      compatibility: "Latest Chrome/Firefox/Safari, responsive design for desktop and mobile"
    },
    environments: [
      { name: "Demo", app: "https://opensource-demo.orangehrmlive.com/" },
      { name: "Local Development", app: "http://localhost:3000/" },
      { name: "Staging", app: "https://staging-demo.orangehrmlive.com/" },
      { name: "Production", app: "https://your-orangehrm-instance.com/" }
    ],
    executionEnv: {
      framework: "Playwright + TypeScript + AI Test Generation",
      browsers: "Chromium, Firefox, WebKit",
      node: ">= 18.0.0",
      parallel: true,
      retriesCI: 2,
      retriesLocal: 0,
      aiIntegration: "Claude AI for story→feature→spec generation",
      testStructure: "Page Object Model with AI-generated locators"
    },
    releaseReadiness: [
      "No critical defects (P0/P1)",
      "Performance benchmarks met (page load ≤ 3s)",
      "Security scan clean (authentication & authorization)",
      "Accessibility audit passes (WCAG 2.1 AA)",
      "Cross-browser compatibility verified",
      "API contract tests green",
      "Demo environment stable and accessible"
    ],
    defectManagement: [
      "Defects logged in Jira, linked to stories",
      "Severity/priority set with QA & PO/dev team",
      "Fixes verified in found environment, re-tested in Preprod"
    ],
    dataMgmt: {
      sources: [
        "Preprod subset (may diverge from Prod)",
        "Dummy trials / internal fixtures for stability"
      ],
      consistency: [
        "Use fixed conditions (e.g., Heart, Lung Cancer) as entry points",
        "Predictable questionnaires for cat 2/3 questions",
        "Mock fixtures simulate API responses"
      ],
      fixtures: "Store request/response fixtures under e2e/utils/fixtures/"
    },
    automation: {
      goals: [
        "Validate critical flows per build",
        "Reduce manual regression effort",
        "Fast CI feedback",
        "Cross-environment with minimal config"
      ],
      framework: [
        "POM structure",
        ".env switching (Local/Dev/Preprod/Prod)",
        "auth-state.json for pre-login sessions",
        "shared helpers for fixtures & test data"
      ],
      structure: {
        tests: "high-level by feature (auth, trials, referrals, profiles)",
        pages: "POMs encapsulating UI interactions",
        utils: "helpers/fixtures/feature flags",
        fixtures: "static payloads & API mocks"
      },
      scopeCovered: [
        "Auth, Search+Filters, Referral, Enrolment updates, API vs UI consistency, critical negatives"
      ],
      featureFlags: "shouldRunTest(testName, userRole) controls conditional execution",
      ci: [
        "Local: npm run test:local",
        "Preprod/Prod: npm run test:preprod / npm run test:prod",
        "GH Actions: matrix (Chromium/Firefox/WebKit), parallel, retries=2, artifacts (HTML, traces)"
      ],
      reporting: "Playwright HTML; failures attach screenshots/console/traces",
      maintenance: "robust locators (data-testid), retries, update fixtures, prune outdated tests"
    },
    reportingMetrics: {
      execReport: ["Total", "Passed/Failed/Skipped", "Retries", "Duration per suite"],
      regressionSummary: ["Defects raised vs fixed"],
      defects: ["Severity distribution", "Open vs Resolved", "Avg time-to-fix"],
      comms: ["Daily stand-up", "Sprint review", "Release sign-off"],
      audit: ["Traceability to Jira", "CI run linkage"]
    },
    risks: [
      { risk: "Employee data inconsistency", mitigation: "API validation, test data management" },
      { risk: "Role permission gaps", mitigation: "Matrix testing, role-based test scenarios" },
      { risk: "Performance degradation", mitigation: "Load testing, monitoring dashboards" },
      { risk: "AI-generated test maintenance", mitigation: "Regular POM updates, locator validation" },
      { risk: "Flaky Tests", mitigation: "Robust AI-generated locators, CI retries, test stability monitoring" }
    ],
    futureImprovements: [
      "Expand AI test generation to cover edge cases",
      "Add negative-path coverage for all modules",
      "Broaden API contract tests for HR workflows",
      "Visual regression testing on critical HR pages",
      "Load tests for concurrent user scenarios",
      "Enhanced test tagging (@smoke/@regression/@hr-critical)",
      "Multi-environment test data strategy",
      "AI model fine-tuning for better test generation",
      "Integration with HR system APIs for realistic test data"
    ]
  };

  // -------- Prompts (explicit & professional) --------
  const systemPrompt = [
    // Role & tone
    "You are a Senior QA Lead and technical writer. Produce a concise, board-ready **Markdown Test Plan** for a web product.",
    "Use clear, assertive language and numbered headings (1., 1.1., 1.2., etc.).",
    "Audience: engineering leads, QA, product owners.",
    // Structure & style
    "Follow this high-level outline (adapt as needed):",
    "1. Introduction and Context",
    "1.1 Product Overview & User Roles",
    "1.2 Scope of Testing (Functional & Non-Functional)",
    "1.3 Testing Approach (Manual, Automation, API, Non-Functional)",
    "1.4 Test Environments & Execution Setup",
    "1.5 Release Readiness Criteria & Defect Management",
    "2. Test Data Management",
    "3. Test Automation Strategy",
    "4. Reporting & Metrics",
    "5. Risks & Mitigations",
    "6. Future Improvements",
    // Content rules
    "Rules:",
    "- Use the product name **OrangeHRM** exactly in headings and prose.",
    "- Keep the voice consistent with HR management system terminology (Admin, ESS, PIM, Leave Management, etc.).",
    "- Include an **Environment Table** with explicit URLs (Demo/Local/Staging/Production).",
    "- Incorporate the Non-Functional targets: page load ≤ 3s and form submission ≤ 2s.",
    "- Emphasize the AI test automation pipeline: stories → features → specs using Claude AI.",
    "- Reference the specific npm commands available in this QA AI starter project (ai:stories, ai:specs:all, extract:locators).",
    "- Highlight Page Object Model with AI-generated locators for maintainable test automation.",
    "- Maintain professional tone suitable for engineering leadership and stakeholders.",
    "- Add **Run Commands** (npm) consistent with AI-powered Playwright test generation.",
    "- Output ONLY Markdown (no code fences).",
  ].join('\n');

  // Remove duplicate declarations - already done above
  // const featureFiles = globFiles(FLAGS.featuresDir, '.feature');
  // const featureSummary = summarizeFeatures(featureFiles);
  // const envs = readEnvFiles(FLAGS.envGlobs);

  const payload = {
    project: FLAGS.project,
    envFiles: envs.map(e => ({ file: e.file, vars: Object.keys(e.vars).sort() })),
    features: featureSummary,
    suites: ['@smoke','@regression','@api','@visual','@perf-candidate','@uat','@security','@a11y'],
    orangeHRMBrief
  };

  const userPrompt = `
Goal: Generate a **professional Markdown Test Plan** for **OrangeHRM** that aligns with HR management system documentation and vocabulary.

Use this canonical domain brief (authoritative and binding):
${mdEscape(JSON.stringify(orangeHRMBrief, null, 2))}

Local repository inputs for this run:
${mdEscape(JSON.stringify(payload, null, 2))}

Authoring constraints:
- Use numbered sections and sub-sections.
- Mirror terminology exactly as in the domain brief (e.g., "Employee Information Management (PIM)", "Leave Management workflows", "page load ≤ 3s").
- Emphasize AI-powered test generation capabilities and Page Object Model architecture.
- Include: Purpose & Context, Functional & Non-Functional Scope, Testing Approach (AI/Manual/Automation/API/NFR), Test Environments (explicit URL table), Release Readiness & Defect Management, Test Data Management, AI Test Generation Strategy, Reporting & Metrics, Risks & Mitigations, Future Improvements.
- Provide **Run Commands** for Playwright (local & CI) and explain retry/parallelization settings.
- Map scanned .feature files into suggested suites/tags and list scenario counts per suite.
- Keep it concise (≈ 2–4 pages of Markdown) and review-friendly.

Return your Markdown wrapped by these markers so subsequent runs can safely update only this block:
<!-- AUTOGEN:TESTPLAN START -->
...your generated plan here...
<!-- AUTOGEN:TESTPLAN END -->
`.trim();

  // Call the agent
  const md = await callAgent(systemPrompt, userPrompt, FLAGS.maxTokens);

  // Write/merge
  const autogenOpen = '<!-- AUTOGEN:TESTPLAN START -->';
  const autogenClose = '<!-- AUTOGEN:TESTPLAN END -->';
  const outPath = path.resolve(cwd, FLAGS.out);
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  let finalDoc = md;
  if (fs.existsSync(outPath)) {
    const existing = fs.readFileSync(outPath, 'utf8');
    if (existing.includes(autogenOpen) && existing.includes(autogenClose)) {
      const before = existing.split(autogenOpen)[0];
      const afterParts = existing.split(autogenClose);
      const after = afterParts.length > 1 ? afterParts[1] : '';
      
      // Extract the generated content from the AI response
      const mdStartIndex = md.indexOf(autogenOpen);
      const mdEndIndex = md.indexOf(autogenClose);
      
      if (mdStartIndex !== -1 && mdEndIndex !== -1) {
        const inner = md.substring(mdStartIndex, mdEndIndex + autogenClose.length);
        finalDoc = before + inner + after;
      } else {
        // If markers not found in AI response, wrap the entire response
        finalDoc = before + autogenOpen + '\n' + md + '\n' + autogenClose + after;
      }
    }
  }

  fs.writeFileSync(outPath, finalDoc, 'utf8');

  console.log(`✅ Test Plan generated → ${path.relative(cwd, outPath)}`);
  console.log(`   Features: ${featureSummary.length} files; ${featureSummary.reduce((n,f)=>n+f.scenarios.length,0)} scenarios`);
  console.log(`   Envs: ${payload.envFiles.length} (${payload.envFiles.map(e => e.file).join(', ')})`);
}

main().catch(err => {
  console.error('❌ Failed to generate Test Plan:', err);
  process.exit(1);
});
