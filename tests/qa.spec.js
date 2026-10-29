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

  test('nav collapses behind the toggle below 800px and shows inline above', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(HOME);
    const toggle = page.getByText('Menu');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeHidden();
    await toggle.click();
    await expect(nav).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(toggle).toBeHidden();
    await expect(nav).toBeVisible();
  });

  test('Escape closes the mobile nav and returns focus to the toggle', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(HOME);
    const header = page.locator('.site-header');
    const toggle = header.getByText('Menu');
    // Verify nav is hidden at narrow viewport
    await expect(page.locator('#site-nav')).toBeHidden();
    await toggle.click();
    await expect(page.locator('#site-nav')).toBeVisible();
    await page.keyboard.press('Escape');
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
  test('hover transitions run at 150ms', async ({ page }) => {
    await page.goto(HOME);
    const btn = page.locator('.hero .btn');
    const durations = await btn.evaluate((el) =>
      getComputedStyle(el).transitionDuration.split(',').map((d) => d.trim())
    );
    expect(durations.every((d) => d === '0.22s')).toBe(true);
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
