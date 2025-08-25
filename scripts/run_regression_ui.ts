#!/usr/bin/env tsx
/**
 * Runs Playwright visual test then creates pixel diffs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Ensure baseline exists; if not, create from current run
function ensureBaseline(): void {
  const cur = path.join("screenshots", "current", "home.png");
  const base = path.join("baselines", "home.png");

  if (!fs.existsSync(base) && fs.existsSync(cur)) {
    fs.mkdirSync("baselines", { recursive: true });
    fs.copyFileSync(cur, base);
    console.log("Baseline created from current:", base);
  }
}

console.log("1) Running visual spec to capture current screenshots...");
spawnSync(
  "npx",
  ["playwright", "test", "tests/e2e/dashboard.spec.ts"], // updated to .ts if you converted the spec
  { stdio: "inherit", shell: true }
);

ensureBaseline();

console.log("2) Generating visual diffs...");
spawnSync("tsx", ["scripts/ui_diff.ts"], { stdio: "inherit", shell: true });
