// @ts-check
import { test, expect } from '@playwright/test';
import { MEETING, SPEAKER_MEETING, JOB_DETAIL, ALL_PAGES, HOME } from './fixtures.js';

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

// ── Phase 3: Homepage components ────────────────────────────────────────────────

test.describe('homepage components', () => {
  test('stat bar renders with at least one number', async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator('.stat-bar__number').first()).toBeVisible();
  });

  test('hero shows a Register button when present', async ({ page }) => {
    await page.goto(HOME);
    const hero = page.locator('.hero');
    if ((await hero.count()) > 0) {
      await expect(hero.getByRole('link', { name: /Register/i })).toBeVisible();
    }
  });

  test('job cards render on homepage', async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator('.job-card').first()).toBeVisible();
  });
});

// ── Phase 4: Board page ────────────────────────────────────────────────────────

test.describe('board page', () => {
  test('renders a grid of board member cards', async ({ page }) => {
    await page.goto('/about/sv-issa-board/');
    const cards = page.locator('.board-member');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('each non-vacant card has an avatar image', async ({ page }) => {
    await page.goto('/about/sv-issa-board/');
    const avatars = page.locator(
      '.board-member:not(.board-member--vacant) .board-member__avatar'
    );
    const count = await avatars.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(avatars.nth(i)).toHaveAttribute('src', /.+/);
    }
  });

  test('bio details toggle is present', async ({ page }) => {
    await page.goto('/about/sv-issa-board/');
    const details = page.locator('.board-member__details').first();
    await expect(details).toBeVisible();
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
  });
});

// ── Phase 5: Meetings pages ────────────────────────────────────────────────────

test.describe('meetings list pages', () => {
  test('past meetings shows at least one year group heading', async ({ page }) => {
    await page.goto('/meetings/past/');
    expect(await page.locator('.meetings-year__heading').count()).toBeGreaterThan(0);
  });

  test('upcoming meetings shows card grid when meetings exist', async ({ page }) => {
    await page.goto('/meetings/upcoming/');
    const cards = page.locator('.meeting-card');
    if ((await cards.count()) > 0) {
      await expect(cards.first().locator('.meeting-card__date')).toBeVisible();
    }
  });

  test('meeting detail has a breadcrumb back to past meetings', async ({ page }) => {
    await page.goto(MEETING);
    const crumb = page.locator('.breadcrumb a');
    await expect(crumb).toBeVisible();
    await expect(crumb).toHaveAttribute('href', /\/meetings\/past\//);
  });
});

// ── Phase 6: Jobs pages ────────────────────────────────────────────────────────

test.describe('jobs pages', () => {
  test('jobs list shows card grid', async ({ page }) => {
    await page.goto('/jobs/');
    const cards = page.locator('.job-card');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('job detail has a breadcrumb back to jobs', async ({ page }) => {
    await page.goto(JOB_DETAIL);
    const crumb = page.locator('.breadcrumb a');
    await expect(crumb).toBeVisible();
    await expect(crumb).toHaveAttribute('href', /\/jobs\//);
  });
});
