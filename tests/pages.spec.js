// @ts-check
import { test, expect } from '@playwright/test';
import { MEETING, SPEAKER_MEETING, ALL_PAGES } from './fixtures.js';

test.describe('title banner', () => {
  for (const url of ALL_PAGES) {
    test(`${url} shows one banner heading`, async ({ page }) => {
      await page.goto(url);
      await expect(page.locator('main .page-banner h1')).toHaveCount(1);
      await expect(page.locator('main .container')).toHaveCount(1);
    });
  }
});

test.describe('meeting detail', () => {
  test('sponsors appear in the aside with links and logos', async ({ page }) => {
    await page.goto(MEETING);
    const aside = page.locator('aside.detail__aside');
    await expect(aside.getByRole('heading', { name: 'Sponsors' })).toBeVisible();
    await expect(aside.locator('.sponsors img')).toHaveCount(2);
    await expect(aside.locator('.sponsors a').first()).toHaveAttribute('href', /netskope/);
  });

  test('speaker bios render in the body, names in the aside', async ({ page }) => {
    await page.goto(SPEAKER_MEETING);
    await expect(page.locator('.prose .speaker__name', { hasText: 'M.K. Palmore' })).toBeVisible();
    await expect(page.locator('aside.detail__aside .plain-list')).toContainText('M.K. Palmore');
  });

  test('RSVP button carries the ISSA utm parameter', async ({ page }) => {
    await page.goto(MEETING);
    await expect(page.getByRole('link', { name: 'RSVP' })).toHaveAttribute('href', /utm_source=issa_website$/);
  });

  test('no broken markup from the old template', async ({ page }) => {
    await page.goto(SPEAKER_MEETING);
    const html = await page.content();
    expect(html).not.toContain('ZgotmplZ');
  });

  test('aside sits beside the body on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(MEETING);
    const prose = await page.locator('.prose').first().boundingBox();
    const aside = await page.locator('aside.detail__aside').boundingBox();
    expect(aside.x).toBeGreaterThan(prose.x + prose.width - 1);
  });

  test('aside stacks above the body on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(MEETING);
    const prose = await page.locator('.prose').first().boundingBox();
    const aside = await page.locator('aside.detail__aside').boundingBox();
    expect(aside.y).toBeLessThan(prose.y);
  });
});

test.describe('markup hygiene', () => {
  for (const url of ALL_PAGES) {
    test(`${url} has no inline style attributes or dead internal links`, async ({ page, request }) => {
      await page.goto(url);
      await expect(page.locator('[style]')).toHaveCount(0);

      const hrefs = await page.locator('main a[href^="/"]').evaluateAll((links) =>
        [...new Set(links.map((a) => a.getAttribute('href')))]
      );
      for (const href of hrefs) {
        const res = await request.get(href);
        expect(res.status(), `link ${href} on ${url}`).toBeLessThan(400);
      }
    });
  }
});
