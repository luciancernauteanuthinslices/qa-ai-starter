#!/usr/bin/env node
// Send a simple message to Slack or Teams via incoming webhook
import 'dotenv/config';

const [,, msg='Hello from QA automation'] = process.argv;
const slack = process.env.SLACK_WEBHOOK_URL;
const teams = process.env.TEAMS_WEBHOOK_URL;

async function post(url, text) {
  const payload = url === teams ? { text } : { text };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw new Error(`Webhook HTTP ${resp.status}`);
}

(async () => {
  try {
    if (slack) await post(slack, msg);
    if (teams) await post(teams, msg);
    if (!slack && !teams) console.log('[notify]', msg, '(no webhook configured)');
    else console.log('Notification sent.');
  } catch (e) {
    console.error('Notification failed:', e.message);
  }
})();
