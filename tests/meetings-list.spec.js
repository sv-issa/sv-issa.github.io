// @ts-check
import { test, expect } from '@playwright/test';

const PAST = '/meetings/past/';
const UPCOMING = '/meetings/upcoming/';

test.describe('past meetings listing', () => {
  test('cards are in a two-column grid on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PAST);
    const cards = page.locator('.meetings-past-grid .meeting-card');
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first && second).toBeTruthy();
    // Same row, side by side
    expect(Math.abs(first.y - second.y)).toBeLessThan(2);
    expect(second.x).toBeGreaterThan(first.x + first.width - 1);
  });

  test('cards stack in one column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(PAST);
    const cards = page.locator('.meetings-past-grid .meeting-card');
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first && second).toBeTruthy();
    expect(second.y).toBeGreaterThan(first.y + first.height - 1);
  });

  test('each year has a heading and its own grid', async ({ page }) => {
    await page.goto(PAST);
    const sections = page.locator('section.meetings-year');
    await expect(sections.first()).toBeVisible();
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const year = await sections.nth(i).locator('.meetings-year__heading').innerText();
      expect(year.trim()).toMatch(/^\d{4}$/);
      await expect(sections.nth(i).locator('.meetings-past-grid')).toHaveCount(1);
    }
  });

  test('past cards keep the year in the date badge', async ({ page }) => {
    await page.goto(PAST);
    const badge = page.locator('.meeting-card__year').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/^\d{4}$/);
  });

  test('past cards omit the location', async ({ page }) => {
    await page.goto(PAST);
    const metas = await page.locator('.meeting-card__meta').allInnerTexts();
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      // Format is "Date · time" with no third "·" segment
      expect(m.split('·').length).toBeLessThanOrEqual(2);
    }
  });

  test('summaries are shortened and end with a Read more link', async ({ page }) => {
    await page.goto(PAST);
    const summaries = page.locator('.meeting-card__summary');
    const count = await summaries.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const s = summaries.nth(i);
      // Measure the summary text only, without the trailing link
      const text = await s.evaluate((el) => {
        const clone = /** @type {HTMLElement} */ (el.cloneNode(true));
        clone.querySelector('.meeting-card__readmore')?.remove();
        return (clone.textContent || '').replace(/\s+/g, ' ').trim();
      });
      expect(text.length).toBeLessThanOrEqual(125);
      await expect(s.locator('.meeting-card__readmore')).toHaveText('Read more');
    }
  });

  test('Read more links to the meeting page and sits on the summary line', async ({ page }) => {
    await page.goto(PAST);
    const link = page.locator('.meeting-card').first().locator('.meeting-card__readmore');
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/meetings\/.+\/$/);
    const summary = page.locator('.meeting-card').first().locator('.meeting-card__summary');
    const s = await summary.boundingBox();
    const l = await link.boundingBox();
    expect(s && l).toBeTruthy();
    // Link is inline in the summary paragraph, not a separate block below it
    expect(l.y + l.height).toBeLessThanOrEqual(s.y + s.height + 1);
  });

  test('Read more matches the summary font size and colour', async ({ page }) => {
    await page.goto(PAST);
    const [sum, link] = await Promise.all([
      page.locator('.meeting-card__summary').first().evaluate((el) => {
        const cs = getComputedStyle(el);
        return { size: cs.fontSize, color: cs.color };
      }),
      page.locator('.meeting-card__readmore').first().evaluate((el) => {
        const cs = getComputedStyle(el);
        return { size: cs.fontSize, color: cs.color };
      }),
    ]);
    expect(link.size).toBe(sum.size);
    expect(link.color).toBe(sum.color);
  });
});

test.describe('upcoming meetings listing', () => {
  test('cards are full width, one per row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(UPCOMING);
    const container = await page.locator('main .container').first().boundingBox();
    const card = await page.locator('.meetings-upcoming-list .meeting-card').first().boundingBox();
    expect(card && container).toBeTruthy();
    expect(card.width).toBeGreaterThan(container.width * 0.8);
  });

  test('cards show the location', async ({ page }) => {
    await page.goto(UPCOMING);
    const meta = page.locator('.meetings-upcoming-list .meeting-card__meta').first();
    await expect(meta).toContainText('·');
    const parts = (await meta.innerText()).split('·');
    expect(parts.length).toBeGreaterThanOrEqual(3);
  });

  test('cards have a Register button and Read more link', async ({ page }) => {
    await page.goto(UPCOMING);
    const card = page.locator('.meetings-upcoming-list .meeting-card').first();
    await expect(card.locator('.btn')).toContainText('Register');
    await expect(card.locator('.meeting-card__readmore')).toHaveText('Read more');
  });
});
