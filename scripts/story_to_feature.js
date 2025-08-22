#!/usr/bin/env node
// Converts YAML stories -> Gherkin .feature files (rule-based; optional AI enhancement)
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import 'dotenv/config';

const [, , storiesDir='stories', featuresDir='features'] = process.argv;

if (!fs.existsSync(featuresDir)) fs.mkdirSync(featuresDir, { recursive: true });

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const apiKey = process.env.OPENAI_API_KEY;

function toFeature(story) {
  const lines = [];
  const name = `${story.id || 'Story'}: ${story.title || ''}`.trim();
  lines.push(`Feature: ${name}`);
  lines.push('');
  lines.push(`  As a ${story.as_a}`);
  lines.push(`  I want ${story.i_want}`);
  lines.push(`  So that ${story.so_that}`);
  lines.push('');
  lines.push('  Scenario: Happy path');
  (story.acceptance_criteria || []).forEach(step => {
    lines.push(`    ${step}`);
  });
  return lines.join('\n');
}

async function maybeEnhanceWithAI(featureText) {
  if (!apiKey) return featureText;
  try {
    // Minimal fetch-based call to OpenAI for refinement (fallback-safe)
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are a senior QA who writes clear, executable Gherkin scenarios.' },
          { role: 'user', content: `Refine this Gherkin to be consistent and actionable. Keep it short and do not add extraneous scenarios.\n\n${featureText}` }
        ],
        temperature: 0.2
      })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const refined = data.choices?.[0]?.message?.content?.trim();
    return refined || featureText;
  } catch (e) {
    console.error('[AI] Enhancement failed, using rule-based output. Reason:', e.message);
    return featureText;
  }
}

async function run() {
  const files = fs.readdirSync(storiesDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(storiesDir, file), 'utf8');
    const story = yaml.load(raw);
    const feature = toFeature(story);
    const finalFeature = await maybeEnhanceWithAI(feature);
    const outName = file.replace(/\.(yml|yaml)$/i, '.feature');
    fs.writeFileSync(path.join('features', outName), finalFeature, 'utf8');
    console.log('Generated:', path.join('features', outName));
  }
}

run();
