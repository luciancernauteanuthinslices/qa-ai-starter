import {test} from '@playwright/test'
import { prompt as aiPrompt } from '../ai/claudeAgent';

test('Playing around with promting ', async ({page})=>{
  const url = 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login'
    await page.goto(url);
    const { response } = await aiPrompt({
        system: 'You are a professional QA Lead. Output bullets only.',
        input: ` Reading the page from ${url} Create 2 comprehensive test scenarious for the given page.
      `,
        maxTokens: 200
      });
      console.log(response);
})