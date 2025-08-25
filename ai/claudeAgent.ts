import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!apiKey) console.warn('[ai] Missing CLAUDE_API_KEY/ANTHROPIC_API_KEY in .env');

const client = new Anthropic({ apiKey });

type PromptArgs = {
  input: string;
  system?: string;
  maxTokens?: number;
  model?: string;
};

export async function prompt({ input, system, maxTokens, model }: PromptArgs): Promise<{ response: string }> {
  if (!apiKey) throw new Error('CLAUDE_API_KEY missing');
  const chosenModel = model || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest';

  const res = await client.messages.create({
    model: chosenModel,
    max_tokens: maxTokens ?? 3000,
    system,
    messages: [{ role: 'user', content: input }],
  });

  const text = res.content?.map((c: any) => ('text' in c ? c.text : JSON.stringify(c))).join('\n').trim() || '';
  return { response: text };
}
