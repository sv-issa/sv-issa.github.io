// @ts-check
import { test, expect } from '@playwright/test';
import { ALL_PAGES, HOME, MEETING, BREAKPOINTS } from './fixtures.js';

const BLUE_RGB = 'rgb(11, 79, 138)';

test.describe('landmarks and headings', () => {
  for (const url of [HOME, ...ALL_PAGES]) {
    test(`${url} exposes banner, main, contentinfo and one h1`, async ({ page }) => {
      await page.goto(url);
      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    });
  }
});

test.describe('responsive layout', () => {
  for (const bp of BREAKPOINTS) {
    test(`no horizontal overflow at ${bp.name} (${bp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      for (const url of [HOME, ...ALL_PAGES]) {
        await page.goto(url);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow, `${url} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  // Phase 2: nav toggle is a CSS checkbox + label (no JS).
  test('nav is hidden by default on mobile and visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(HOME);
    const nav = page.locator('#site-nav');
    await expect(nav).toBeHidden();

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(nav).toBeVisible();
  });

  test('nav toggle label opens and closes the mobile nav', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(HOME);
    const label = page.locator('label.nav-toggle');
    const nav   = page.locator('#site-nav');
    await expect(nav).toBeHidden();
    await label.click();
    await expect(nav).toBeVisible();
    await label.click();
    await expect(nav).toBeHidden();
  });
});

test.describe('keyboard and focus', () => {
  test('skip link is the first tab stop and shows a focus ring', async ({ page }) => {
    await page.goto(HOME);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveCSS('outline-style', 'solid');
    await expect(skip).toHaveCSS('outline-width', '3px');
  });

  test('footer focus ring uses the light token on the dark band', async ({ page }) => {
    await page.goto(HOME);
    await page.keyboard.press('Tab'); // keyboard modality, so :focus-visible applies
    const footerLink = page.locator('.site-footer a').first();
    await footerLink.focus();
    await expect(footerLink).toBeFocused();
    await expect(footerLink).toHaveCSS('outline-color', 'rgb(255, 255, 255)');
  });
});

test.describe('current page state', () => {
  test('current nav link is marked with aria-current and styled blue', async ({ page }) => {
    await page.goto('/jobs/');
    const current = page.locator('#site-nav a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText('Jobs');
    await expect(current).toHaveCSS('color', BLUE_RGB);
  });

  test('no legacy active/ancestor classes remain in the nav', async ({ page }) => {
    await page.goto('/jobs/');
    await expect(page.locator('#site-nav .active, #site-nav .ancestor')).toHaveCount(0);
  });
});

test.describe('motion', () => {
  test('hover transitions run at 150ms or 220ms', async ({ page }) => {
    await page.goto(HOME);
    const btn = page.locator('.hero .btn');
    const durations = await btn.evaluate((el) =>
      getComputedStyle(el).transitionDuration.split(',').map((d) => d.trim())
    );
    const valid = new Set(['0.15s', '0.22s']);
    expect(
      durations.every((d) => valid.has(d)),
      `Unexpected durations: ${durations}`
    ).toBe(true);
  });

  test('reduced motion removes transition time', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(HOME);
    const duration = await page.locator('.hero .btn').evaluate(
      (el) => parseFloat(getComputedStyle(el).transitionDuration)
    );
    expect(duration).toBeLessThan(0.001);
  });
});

test.describe('interaction states', () => {
  test('grid card lifts on hover (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(HOME);
    const card = page.locator('.card-grid > .card').first();
    const before = await card.evaluate((el) => getComputedStyle(el).transform);
    await card.hover();
    await expect.poll(() => card.evaluate((el) => getComputedStyle(el).transform)).not.toBe(before);
  });

  test('aside card on detail page does not lift on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(MEETING);
    const aside = page.locator('aside.detail__aside').first();
    await aside.hover();
    const t = await aside.evaluate((el) => getComputedStyle(el).transform);
    expect(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });

  test('nav toggle shows a focus ring when the checkbox is focused via keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(HOME);
    await page.locator('.nav-checkbox').focus();
    await page.keyboard.press('Tab'); // move to the next focusable item, then back
    await page.keyboard.press('Shift+Tab');
    const outline = await page.locator('label.nav-toggle').evaluate(
      (el) => getComputedStyle(el).outlineStyle
    );
    expect(outline).toBe('solid');
  });

  test('checkbox is not aria-hidden', async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator('.nav-checkbox')).not.toHaveAttribute('aria-hidden', 'true');
  });
});

test.describe('no script', () => {
  for (const url of [HOME, ...ALL_PAGES]) {
    test(`${url} has no <script> tags`, async ({ page }) => {
      await page.goto(url);
      const count = await page.locator('script').count();
      expect(count, `${url} emitted ${count} script tag(s)`).toBe(0);
    });
  }

  test('html element has no js class', async ({ page }) => {
    await page.goto(HOME);
    const hasJsClass = await page.evaluate(
      () => document.documentElement.classList.contains('js')
    );
    expect(hasJsClass).toBe(false);
  });
});

test.describe('print', () => {
  test('header, footer and buttons are hidden; content stays', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await page.goto(MEETING);
    await expect(page.locator('.site-header')).toBeHidden();
    await expect(page.locator('.site-footer')).toBeHidden();
    await expect(page.locator('.facts__actions .btn')).toBeHidden();
    await expect(page.locator('main .prose')).toBeVisible();
  });
});
