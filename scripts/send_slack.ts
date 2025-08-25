#!/usr/bin/env tsx
/**
 * Send a simple message to Slack or Teams via incoming webhook
 */
import "dotenv/config";

const [, , msgArg] = process.argv;
const msg = msgArg || "Hello from QA automation";

const slack: string | undefined = process.env.SLACK_WEBHOOK;
const teams: string | undefined = process.env.TEAMS_WEBHOOK;

async function post(url: string, text: string): Promise<void> {
  // Slack and Teams both accept `{ text }` as payload
  const payload = { text };
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    throw new Error(`Webhook HTTP ${resp.status}`);
  }
}

(async () => {
  try {
    if (slack) await post(slack, msg);
    if (teams) await post(teams, msg);

    if (!slack && !teams) {
      console.log("[notify]", msg, "(no webhook configured)");
    } else {
      console.log("Notification sent.");
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error("Notification failed:", e.message);
    } else {
      console.error("Notification failed:", e);
    }
    process.exit(1);
  }
})();
