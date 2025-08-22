import { test, expect } from '@playwright/test';

test('api: sample GET', async ({ request }) => {
  // Simple public endpoint for demo; replace with your API
  const res = await request.get('https://httpbin.org/json');
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data).toHaveProperty('slideshow');
});
