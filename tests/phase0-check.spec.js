// Phase 0 content prep validation
import { test, expect } from '@playwright/test';

test('board page loads without errors', async ({ page }) => {
  const response = await page.goto('/about/sv-issa-board/');
  expect(response?.status()).toBe(200);
  const body = await page.textContent('body');
  // Verify key board member names are present (data file rendered as markdown)
  for (const name of ['Mike Skurko', 'Tyler Pinckard', 'Victor Chang', 'Elissa Silveira', 'Kelly Robertson', 'Fred Anderson', 'Jerry Swartz', 'Alexander J. Dita', 'Edward Frye']) {
    expect(body).toContain(name);
  }
});

test('avatar placeholder image is accessible', async ({ page }) => {
  const resp = await page.goto('/images/avatar-placeholder.png');
  expect(resp?.status()).toBe(200);
});
