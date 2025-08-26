#!/usr/bin/env tsx
/**
 * Send comprehensive QA pipeline reports to Slack or Teams via incoming webhook
 */
import "dotenv/config";
import fs from 'fs';
import path from 'path';

interface SlackAttachment {
  color: string;
  title: string;
  text: string;
  fields?: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
}

interface SlackPayload {
  text: string;
  attachments?: SlackAttachment[];
}

const [, , msgArg, summaryPath] = process.argv;
const msg = msgArg || "QA Pipeline Completed";
const summaryFile = summaryPath || "reports/summaries/last.md";

const slack: string | undefined = process.env.SLACK_WEBHOOK;
const teams: string | undefined = process.env.TEAMS_WEBHOOK;
const githubRunNumber = process.env.GITHUB_RUN_NUMBER;
const githubRepository = process.env.GITHUB_REPOSITORY;
const githubRunId = process.env.GITHUB_RUN_ID;
const githubActor = process.env.GITHUB_ACTOR;
const githubRef = process.env.GITHUB_REF_NAME;

function parseQASummary(summaryContent: string): SlackAttachment {
  const lines = summaryContent.split('\n');
  let testsPassed = 0;
  let testsFailed = 0;
  let totalTests = 0;
  let status = 'unknown';
  let color = '#36a64f'; // green
  
  // Parse test results
  for (const line of lines) {
    if (line.includes('✅ Passed')) {
      const match = line.match(/(\d+)/);
      if (match) testsPassed = parseInt(match[1]);
    }
    if (line.includes('❌ Failed')) {
      const match = line.match(/(\d+)/);
      if (match) testsFailed = parseInt(match[1]);
    }
    if (line.includes('Total Tests')) {
      const match = line.match(/(\d+)/);
      if (match) totalTests = parseInt(match[1]);
    }
    if (line.includes('ALL TESTS PASSED')) {
      status = 'passed';
      color = '#36a64f'; // green
    }
    if (line.includes('TESTS FAILED')) {
      status = 'failed';
      color = '#ff0000'; // red
    }
  }
  
  const runUrl = githubRepository && githubRunId 
    ? `https://github.com/${githubRepository}/actions/runs/${githubRunId}`
    : '';
  
  const fields = [
    {
      title: "Tests Passed",
      value: testsPassed.toString(),
      short: true
    },
    {
      title: "Tests Failed", 
      value: testsFailed.toString(),
      short: true
    },
    {
      title: "Total Tests",
      value: totalTests.toString(),
      short: true
    },
    {
      title: "Triggered By",
      value: githubActor || 'Unknown',
      short: true
    }
  ];
  
  if (githubRef) {
    fields.push({
      title: "Branch",
      value: githubRef,
      short: true
    });
  }
  
  if (runUrl) {
    fields.push({
      title: "View Details",
      value: `<${runUrl}|GitHub Actions Run #${githubRunNumber}>`,
      short: false
    });
  }
  
  return {
    color,
    title: `QA Pipeline ${status === 'passed' ? '✅ Passed' : status === 'failed' ? '❌ Failed' : '⚠️ Completed'}`,
    text: summaryContent.length > 500 ? summaryContent.substring(0, 500) + '...' : summaryContent,
    fields
  };
}

async function postSlack(url: string, payload: SlackPayload): Promise<void> {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Slack webhook HTTP ${resp.status}: ${errorText}`);
  }
}

async function postTeams(url: string, text: string): Promise<void> {
  // Teams webhook format
  const payload = { text };
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Teams webhook HTTP ${resp.status}: ${errorText}`);
  }
}

(async () => {
  try {
    let summaryContent = msg;
    
    // Try to read the summary file if it exists
    if (fs.existsSync(summaryFile)) {
      summaryContent = fs.readFileSync(summaryFile, 'utf8');
      console.log(`📊 Loaded summary from: ${summaryFile}`);
    } else {
      console.log(`⚠️ Summary file not found: ${summaryFile}, using default message`);
    }
    
    if (slack) {
      const attachment = parseQASummary(summaryContent);
      const slackPayload: SlackPayload = {
        text: `🤖 *QA AI Pipeline Report* - Run #${githubRunNumber || 'Unknown'}`,
        attachments: [attachment]
      };
      
      await postSlack(slack, slackPayload);
      console.log("✅ Slack notification sent with comprehensive report");
    }
    
    if (teams) {
      // Teams gets simplified text format
      const teamsMessage = `🤖 QA AI Pipeline Report - Run #${githubRunNumber || 'Unknown'}\n\n${summaryContent}`;
      await postTeams(teams, teamsMessage);
      console.log("✅ Teams notification sent");
    }

    if (!slack && !teams) {
      console.log("[notify]", "No webhook configured. Set SLACK_WEBHOOK or TEAMS_WEBHOOK environment variable.");
      console.log("Summary content:");
      console.log(summaryContent);
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error("❌ Notification failed:", e.message);
    } else {
      console.error("❌ Notification failed:", e);
    }
    process.exit(1);
  }
})();
