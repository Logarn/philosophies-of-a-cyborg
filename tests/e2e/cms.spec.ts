import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const publicRoutes = [
  '/',
  '/projects/',
  '/essays/',
  '/archive/',
  '/values/',
  '/store/',
  '/handbook/',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest'
];
const adminAuth = `Basic ${Buffer.from('ositu:playwright-admin-password').toString('base64')}`;

async function plantAnswer(page: import('@playwright/test').Page, answer: string) {
  for (const [index, letter] of [...answer].entries()) {
    await page.locator('.letter-tile').filter({ hasText: letter }).first().click();
    await page.locator(`.letter-slot[data-slot-index="${index}"]`).click();
  }
}

test.describe('public CMS surface', () => {
  test('public routes respond and admin is locked', async ({ request }) => {
    for (const route of publicRoutes) {
      const response = await request.get(route);
      expect.soft(response.status(), route).toBeLessThan(400);
    }

    expect.soft([401, 503]).toContain((await request.get('/admin/')).status());
    expect.soft([401, 503]).toContain((await request.post('/api/admin/content', {
      data: {},
      headers: { 'content-type': 'application/json' }
    })).status());
  });

  test('admin save serializes multiline homepage and essay content safely', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'admin serialization is project-independent');

    const response = await request.post('/api/admin/content', {
      headers: {
        authorization: adminAuth,
        'content-type': 'application/json',
        'x-poc-admin-action': 'save-content'
      },
      data: {
        action: 'save',
        homepage: {
          eyebrow: 'Rough notes',
          headline: 'Line one stays calm',
          intro: 'A first line.\nA second line with "quotes" and apostrophes.',
          cta: 'Read it'
        },
        draft: {
          slug: 'playwright-multiline-check',
          title: 'A title with "quotes"',
          summary: 'Line one summary.\nLine two summary.',
          publishedAt: '2026-05-19',
          status: 'published',
          pinned: false,
          readingTime: '2 min read',
          mood: 'testing',
          body: '# Heading\n\nBody with a colon: yes.'
        }
      }
    });

    await expect(response).toBeOK();
    const root = resolve('output/playwright/admin-fixture');
    const siteCopy = await readFile(resolve(root, 'src/lib/siteCopy.ts'), 'utf8');
    const essay = await readFile(resolve(root, 'src/content/essays/playwright-multiline-check.md'), 'utf8');

    expect(siteCopy).toContain('A first line.\\nA second line');
    expect(essay).toContain('summary: |-');
    expect(essay).toContain('  Line two summary.');
    expect(essay).toContain('# Heading');
  });

  test('desktop shortcuts and internal links have valid targets', async ({ page, request, baseURL }) => {
    await page.goto('/');
    await expect(page.locator('.desktop-object')).toHaveCount(16);
    await expect(page.locator('button[data-action="home"]')).toBeVisible();
    await expect(page.locator('.desktop-object[data-modal="calculator"]')).toBeVisible();

    const links = await page.locator('a.desktop-object').evaluateAll((anchors) => anchors.map((anchor) => ({
      text: anchor.textContent?.trim() ?? '',
      href: (anchor as HTMLAnchorElement).href
    })));

    for (const link of links) {
      expect.soft(link.href, link.text).toBeTruthy();

      if (link.href.startsWith(baseURL ?? '')) {
        const url = new URL(link.href);
        if (url.hash === '#calculator') continue;
        expect.soft((await request.get(`${url.pathname}${url.search}`)).status(), link.text).toBeLessThan(400);
      } else if (link.href.startsWith('mailto:')) {
        expect.soft(link.href, link.text).toContain('manyaos.47@gmail.com');
      } else {
        expect.soft(link.href, link.text).toMatch(/^https:\/\//);
      }
    }
  });

  test('calculator works without unsafe eval', async ({ page }) => {
    await page.goto('/');
    await page.locator('.desktop-object[data-modal="calculator"]').click();
    await expect(page.locator('[data-modal-panel="calculator"]')).toBeVisible();

    for (const key of ['1', '+', '2', '=']) {
      await page.locator(`[data-key="${key}"]`).click();
    }

    await expect(page.locator('[data-calc-display]')).toHaveText('3');
    await page.locator('[data-key="clear"]').click();

    for (const key of ['1', '/', '0', '=']) {
      await page.locator(`[data-key="${key}"]`).click();
    }

    await expect(page.locator('[data-calc-lesson]')).not.toContainText('arithmetic worked');
  });

  test('calculator can be opened from hash links', async ({ page }) => {
    await page.goto('/#calculator');
    await expect(page.locator('[data-modal-panel="calculator"]')).toBeVisible();
  });

  test('agent mode is plain text with hyperlinks only', async ({ page }) => {
    await page.goto('/');
    await page.locator('a.desktop-object', { hasText: 'Switch to agent mode' }).click();
    await expect(page).toHaveURL('/?mode=agent');
    await expect(page.locator('.posthog-home')).toHaveCount(0);
    await expect(page.locator('body button')).toHaveCount(0);
    expect(await page.locator('.agent-readable a').count()).toBeGreaterThanOrEqual(10);
  });

  test('garden game is visible and resolves win/loss states', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('.letter-tile')).toHaveCount(8);
    await expect(page.locator('.letter-slot')).toHaveCount(8);
    await expect(page.locator('.letter-actions button')).toHaveText('Replant');

    await plantAnswer(page, 'YOUCUNT!');
    await expect(page.locator('[data-prize-dialog][open]')).toBeVisible();
    await page.screenshot({ path: `output/playwright/${testInfo.project.name}-garden-win.png`, fullPage: false });
    await page.locator('[data-prize-close]').click();
    await page.locator('[data-letter-shuffle]').click();

    await plantAnswer(page, '!TNUCUOY');
    await expect(page.locator('[data-lose-dialog][open]')).toBeVisible();
  });
});

test.describe('mobile layout', () => {
  test('homepage desktop area expands before essays and garden controls stay readable', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.locator('.garden-scene').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `output/playwright/${testInfo.project.name}-home.png`, fullPage: false });

    const layout = await page.evaluate(() => {
      const retro = document.querySelector('.retro-desktop')?.getBoundingClientRect();
      const reading = document.querySelector('.home-reading-strip')?.getBoundingClientRect();
      const tiles = [...document.querySelectorAll('.letter-tile')].map((node) => node.getBoundingClientRect());
      const slots = [...document.querySelectorAll('.letter-slot')].map((node) => node.getBoundingClientRect());
      return {
        retroBottom: retro?.bottom ?? 0,
        readingTop: reading?.top ?? 0,
        tileSizes: tiles.map((rect) => ({ width: rect.width, height: rect.height })),
        slotSizes: slots.map((rect) => ({ width: rect.width, height: rect.height }))
      };
    });

    expect(layout.readingTop).toBeGreaterThanOrEqual(layout.retroBottom - 1);
    for (const size of [...layout.tileSizes, ...layout.slotSizes]) {
      expect(size.width).toBeGreaterThan(34);
      expect(size.height).toBeGreaterThan(34);
    }
  });
});
