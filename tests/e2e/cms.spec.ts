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

async function plantAnswer(page: import('@playwright/test').Page, answer: string, startIndex = 0) {
  for (const [offset, letter] of [...answer.slice(startIndex)].entries()) {
    await page.locator(`.letter-tile[data-letter="${letter}"]`).first().click({ force: true });
    await page.locator(`.letter-slot[data-slot-index="${startIndex + offset}"]`).click({ force: true });
  }
}

async function dragBlockToSlot(page: import('@playwright/test').Page, letter: string, slotIndex: number) {
  const tile = await page.locator(`.letter-tile[data-letter="${letter}"]`).first().boundingBox();
  const slot = await page.locator(`.letter-slot[data-slot-index="${slotIndex}"]`).boundingBox();
  expect(tile).not.toBeNull();
  expect(slot).not.toBeNull();
  if (!tile || !slot) return;

  await page.mouse.move(tile.x + tile.width / 2, tile.y + tile.height / 2);
  await page.mouse.down();
  await page.mouse.move(slot.x + slot.width / 2, slot.y + slot.height / 2, { steps: 12 });
  await page.mouse.up();
}

async function dragLocatorToLocator(
  page: import('@playwright/test').Page,
  source: import('@playwright/test').Locator,
  target: import('@playwright/test').Locator
) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  if (!sourceBox || !targetBox) return;

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 12 });
  await page.mouse.up();
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
          hero: {
            eyebrow: 'Rough notes',
            headline: 'Line one stays calm',
            intro: 'A first line.\nA second line with "quotes" and apostrophes.'
          },
          nav: {
            ctaLabel: 'Read it'
          },
          garden: {
            title: 'Play the weird thing',
            intro: 'Plant the scrambled phrase and wake the prize.',
            hint: 'Hint: lean into the chaos',
            buttonLabel: 'Reset beds'
          },
          sections: {
            pinnedHeading: 'Pinned notes',
            pinnedNote: 'Start here before the rest of the archive.',
            allHeading: 'Everything else',
            allNote: 'Full archive after the pinned shortlist.'
          }
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
    await expect(page.locator('.desktop-object[data-modal="quantum-teacher"]')).toBeVisible();

    const links = await page.locator('a.desktop-object').evaluateAll((anchors) => anchors.map((anchor) => ({
      text: anchor.textContent?.trim() ?? '',
      href: (anchor as HTMLAnchorElement).href
    })));

    for (const link of links) {
      expect.soft(link.href, link.text).toBeTruthy();

      if (link.href.startsWith(baseURL ?? '')) {
        const url = new URL(link.href);
        if (url.hash === '#quantum-teacher') continue;
        expect.soft((await request.get(`${url.pathname}${url.search}`)).status(), link.text).toBeLessThan(400);
      } else if (link.href.startsWith('mailto:')) {
        expect.soft(link.href, link.text).toContain('manyaos.47@gmail.com');
      } else {
        expect.soft(link.href, link.text).toMatch(/^https:\/\//);
      }
    }
  });

  test('quantum teacher cycles through simple physics stories', async ({ page }) => {
    await page.goto('/');
    await page.locator('.desktop-object[data-modal="quantum-teacher"]').click();
    await expect(page.locator('[data-modal-panel="quantum-teacher"]')).toBeVisible();

    await expect(page.locator('[data-quantum-title]')).toHaveText('Atomic fire');
    await expect(page.locator('[data-quantum-fact]')).toContainText('nuclear fission');
    await expect(page.locator('[data-quantum-kicker]')).toHaveText('Story 01 / 08');

    await page.locator('[data-quantum-next]').click();
    await expect(page.locator('[data-quantum-title]')).toHaveText('Relativity without the headache');

    await page.locator('[data-quantum-prev]').click();
    await expect(page.locator('[data-quantum-title]')).toHaveText('Atomic fire');
  });

  test('quantum teacher can be opened from hash links', async ({ page }) => {
    await page.goto('/#quantum-teacher');
    await expect(page.locator('[data-modal-panel="quantum-teacher"]')).toBeVisible();
  });

  test('home clears the quantum hash after opening the modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('.desktop-object[data-modal="quantum-teacher"]').click();
    await expect(page).toHaveURL(/#quantum-teacher$/);
    await page.locator('.quantum-links a', { hasText: 'Home' }).click();
    await expect(page).toHaveURL(/(#desktop-home)?$/);
    await expect(page).not.toHaveURL(/#quantum-teacher$/);
    await expect(page.locator('[data-modal-layer]')).toBeHidden();
  });

  test('quantum modal can jump straight to agent mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('.desktop-object[data-modal="quantum-teacher"]').click();
    await page.locator('.quantum-links a', { hasText: 'Agent mode' }).click();
    await expect(page).toHaveURL('/?mode=agent');
    await expect(page.locator('.agent-readable')).toBeVisible();
  });

  test('agent mode is plain text with hyperlinks only', async ({ page }) => {
    await page.goto('/');
    await page.locator('a.desktop-object', { hasText: 'Switch to agent mode' }).click();
    await expect(page).toHaveURL('/?mode=agent');
    await expect(page.locator('.posthog-home')).toHaveCount(0);
    await expect(page.locator('body button')).toHaveCount(0);
    expect(await page.locator('.agent-readable a').count()).toBeGreaterThanOrEqual(10);
  });

  test('garden game blocks dance, hide the insult, drag into beds, and stay fixed', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('.letter-tile')).toHaveCount(8);
    await expect(page.locator('.letter-slot')).toHaveCount(8);
    await expect(page.locator('.letter-actions button')).toHaveText('Replant');
    await expect(page.locator('.game-hint')).not.toContainText('YOU CUNT!');
    const trayAnswer = await page.locator('.letter-tile').evaluateAll((tiles) => tiles.map((tile) => tile.textContent?.trim() ?? '').join('').toUpperCase());
    expect(trayAnswer).not.toBe('YOUCUNT!');

    await expect(page.locator('.letter-tile').first()).toHaveCSS('animation-name', /tray-block-dance|bed-ready/);
    await dragBlockToSlot(page, 'Y', 0);
    await expect(page.locator('.letter-slot[data-slot-index="0"].is-planted')).toBeVisible();
    await expect(page.locator('.letter-slot[data-slot-index="0"] .letter-face')).toHaveCount(1);
    await expect(page.locator('.letter-tile')).toHaveCount(7);
    await expect(page.locator('.letter-slot[data-slot-index="0"]')).toHaveCSS('animation-name', /planted-block-dance|prize-glow/);

    await plantAnswer(page, 'YOUCUNT!', 1);
    await expect(page.locator('[data-prize-dialog][open]')).toBeVisible();
    await page.screenshot({ path: `output/playwright/${testInfo.project.name}-garden-win.png`, fullPage: false });
  });

  test('garden game tap and drag interactions keep tile ownership consistent', async ({ page }) => {
    await page.goto('/');
    await page.locator('.garden-scene').scrollIntoViewIfNeeded();

    const initialTrayCount = page.locator('.letter-tile');
    await expect(initialTrayCount).toHaveCount(8);

    const firstTileId = await page.locator('.letter-tile').first().getAttribute('data-tile-id');
    const secondTileId = await page.locator('.letter-tile').nth(1).getAttribute('data-tile-id');
    const replacementTileId = await page.locator('.letter-tile').nth(2).getAttribute('data-tile-id');
    const firstLetter = await page.locator('.letter-tile').first().getAttribute('data-letter');
    const secondLetter = await page.locator('.letter-tile').nth(1).getAttribute('data-letter');
    const replacementLetter = await page.locator('.letter-tile').nth(2).getAttribute('data-letter');
    expect(firstTileId).toBeTruthy();
    expect(secondTileId).toBeTruthy();
    expect(replacementTileId).toBeTruthy();
    expect(firstLetter).toBeTruthy();
    expect(secondLetter).toBeTruthy();
    expect(replacementLetter).toBeTruthy();

    await page.locator('.letter-tile').first().click({ force: true });
    await page.locator('.letter-slot[data-slot-index="0"]').click({ force: true });
    await expect(page.locator('.letter-slot[data-slot-index="0"]')).toHaveAttribute('data-tile-id', firstTileId ?? '');
    await expect(page.locator('.letter-tile')).toHaveCount(7);

    await page.locator('.letter-slot[data-slot-index="0"]').click({ force: true });
    await page.locator('.letter-slot[data-slot-index="0"]').click({ force: true });
    await expect(page.locator('.letter-slot[data-slot-index="0"] .letter-face')).toHaveCount(0);
    await expect(page.locator('.letter-tile')).toHaveCount(8);
    await expect(page.locator('[data-letter-status]')).toContainText('returned to the tray');

    await page.locator(`.letter-tile[data-letter="${firstLetter}"]`).first().click({ force: true });
    await page.locator('.letter-slot[data-slot-index="0"]').click({ force: true });
    await page.locator(`.letter-tile[data-letter="${secondLetter}"]`).first().click({ force: true });
    await page.locator('.letter-slot[data-slot-index="1"]').click({ force: true });
    await expect(page.locator('.letter-tile')).toHaveCount(6);

    await page.locator('.letter-slot[data-slot-index="0"]').click({ force: true });
    await page.locator('.letter-slot[data-slot-index="1"]').click({ force: true });
    await expect(page.locator('.letter-slot[data-slot-index="0"]')).toHaveAttribute('data-tile-id', secondTileId ?? '');
    await expect(page.locator('.letter-slot[data-slot-index="1"]')).toHaveAttribute('data-tile-id', firstTileId ?? '');
    await expect(page.locator('.letter-tile')).toHaveCount(6);

    await page.locator(`.letter-tile[data-letter="${replacementLetter}"]`).first().click({ force: true });
    await page.locator('.letter-slot[data-slot-index="1"]').click({ force: true });
    await expect(page.locator('.letter-slot[data-slot-index="1"]')).toHaveAttribute('data-tile-id', replacementTileId ?? '');
    await expect(page.locator(`.letter-tile[data-tile-id="${firstTileId}"]`)).toHaveCount(1);
    await expect(page.locator('.letter-tile')).toHaveCount(6);

    await dragLocatorToLocator(
      page,
      page.locator('.letter-slot[data-slot-index="0"]'),
      page.locator('.letter-tray')
    );
    await expect(page.locator('.letter-slot[data-slot-index="0"] .letter-face')).toHaveCount(0);
    await expect(page.locator('.letter-tile')).toHaveCount(7);

    await page.locator('[data-letter-shuffle]').click({ force: true });
    await expect(page.locator('.letter-slot .letter-face')).toHaveCount(0);
    await expect(page.locator('.letter-tile')).toHaveCount(8);
    await expect(page.locator('[data-letter-status]')).toContainText('Tap a letter, then tap an answer bed');
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
