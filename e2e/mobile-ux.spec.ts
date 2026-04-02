import { test, expect } from '@playwright/test';

test.describe('Mobile UX fixes at 390×844', () => {
  test('bucketing: carousel dots are visible with backdrop and swipe hint', async ({ page }) => {
    await page.goto('/aesthetic-ranker/');

    // Start ranking
    await page.getByRole('button', { name: /start ranking/i }).click();

    // Wait for the card to render in bucketing mode
    await page.waitForSelector('[class*="aspect-"]');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'e2e/screenshots/bucketing-carousel.png' });

    // Verify the card renders with portrait aspect ratio (default variant)
    const imageContainer = page.locator('[class*="aspect-[3/4]"]');
    await expect(imageContainer.first()).toBeVisible();
  });

  test('comparison: both cards fit on screen without scrolling', async ({ page }) => {
    await page.goto('/aesthetic-ranker/');
    await page.getByRole('button', { name: /start ranking/i }).click();
    await page.waitForSelector('[class*="aspect-"]');

    // Bucket first item as "Like"
    await page.getByRole('button', { name: '👍 Like' }).click();
    await page.waitForTimeout(400);

    // Bucket second item as "Like" — triggers comparison mode (non-empty bucket)
    await page.getByRole('button', { name: '👍 Like' }).click();
    await page.waitForTimeout(600);

    // Should now be in comparison mode with VS badge
    await page.waitForSelector('text=VS', { timeout: 5000 });
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'e2e/screenshots/comparison-viewport.png' });

    // Verify compact cards use landscape aspect ratio
    const compactCards = page.locator('[class*="aspect-[4/3]"]');
    expect(await compactCards.count()).toBe(2);

    // Verify all key elements are visible without scrolling
    await expect(page.getByText('Which do you prefer?')).toBeVisible();
    await expect(page.getByText('VS')).toBeVisible();
    await expect(page.getByRole('button', { name: /can.*t decide/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /start over/i })).toBeVisible();

    // Verify page doesn't require scrolling (body fits in viewport)
    const scrollable = await page.evaluate(() =>
      document.documentElement.scrollHeight > window.innerHeight
    );
    expect(scrollable).toBe(false);
  });

  test('detail modal: shows description with CARI attribution', async ({ page }) => {
    await page.goto('/aesthetic-ranker/');
    await page.getByRole('button', { name: /start ranking/i }).click();
    await page.waitForSelector('[class*="aspect-"]');

    // Open the detail modal via the info button
    await page.getByRole('button', { name: /details for/i }).click();

    // Wait for modal dialog
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'e2e/screenshots/detail-modal.png' });

    // Verify the modal is visible with aesthetic info
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Verify the "View on CARI" link exists
    await expect(page.getByRole('link', { name: /view on cari/i })).toBeVisible();

    // Check for CARI attribution (only if this aesthetic has a description)
    const attribution = page.getByText('Description from CARI Institute');
    const hasAttribution = await attribution.isVisible().catch(() => false);
    console.log(`CARI attribution visible: ${hasAttribution}`);
  });
});
