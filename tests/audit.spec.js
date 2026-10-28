// @ts-check
/**
 * Playwright audit script for SV-ISSA redesign planning.
 * Captures full-page screenshots at desktop and mobile breakpoints for all major pages.
 */
import { test } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'plan', 'screenshots');

const PAGES = [
  { name: 'home',            url: '/' },
  { name: 'upcoming',        url: '/meetings/upcoming/' },
  { name: 'past-meetings',   url: '/meetings/past/' },
  { name: 'meeting-detail',  url: '/meetings/december-2025-event-sv-issa-winter-holiday-party/' },
  { name: 'meeting-speaker', url: '/meetings/april-2026-event-mission-driven-founder-moving-technologist-entrepreneur/' },
  { name: 'jobs',            url: '/jobs/' },
  { name: 'job-detail',      url: '/jobs/axonius-sr-sales-engineer-pacific-north-west-remote/' },
  { name: 'certifications',  url: '/certifications/' },
  { name: 'board',           url: '/about/sv-issa-board/' },
];

const VIEWPORTS = [
  { label: 'desktop', width: 1280, height: 900 },
  { label: 'mobile',  width: 375,  height: 812 },
];

for (const vp of VIEWPORTS) {
  test.describe(`${vp.label} (${vp.width}px)`, () => {
    for (const pg of PAGES) {
      test(`screenshot: ${pg.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(pg.url);
        await page.waitForLoadState('networkidle');
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `${vp.label}--${pg.name}.png`),
          fullPage: true,
        });
      });
    }
  });
}
