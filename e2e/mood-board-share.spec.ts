import { test } from '@playwright/test';

/**
 * Screenshot script for the mood board and share card features.
 * Injects pre-completed ranking state to jump directly to results.
 */

// Minimal completed state with 3 aesthetics ranked in the "like" bucket
const COMPLETED_STATE = {
  state: {
    appPhase: 'results',
    ranker: {
      aesthetics: [],
      currentIndex: 3,
      buckets: {
        like: [
          {
            name: 'Cassette Futurism',
            urlSlug: 'cassette-futurism',
            startYear: 'Late 1970s',
            endYear: 'Current',
            decadeYear: '1980s',
            displayImageUrl: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzAyMTMyMi9vcmlnaW5hbF9hZDcxMjEwNTk5NWI0OTFhMTY5NjY3MWEwMTIwMDIzNS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0',
            description: 'An aesthetic centered around analog technology and a retro vision of the future.',
            images: [
              { url: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzAyMTMyMi9vcmlnaW5hbF9hZDcxMjEwNTk5NWI0OTFhMTY5NjY3MWEwMTIwMDIzNS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0', title: 'Cassette Futurism 1' },
              { url: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzAyMTMyMi9vcmlnaW5hbF9hZDcxMjEwNTk5NWI0OTFhMTY5NjY3MWEwMTIwMDIzNS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0', title: 'Cassette Futurism 2' },
              { url: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzAyMTMyMi9vcmlnaW5hbF9hZDcxMjEwNTk5NWI0OTFhMTY5NjY3MWEwMTIwMDIzNS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0', title: 'Cassette Futurism 3' },
              { url: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzAyMTMyMi9vcmlnaW5hbF9hZDcxMjEwNTk5NWI0OTFhMTY5NjY3MWEwMTIwMDIzNS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0', title: 'Cassette Futurism 4' },
            ],
          },
          {
            name: 'Vaporwave',
            urlSlug: 'vaporwave',
            startYear: 'Early 2010s',
            endYear: 'Current',
            decadeYear: '2010s',
            displayImageUrl: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzAxODc5Ni9vcmlnaW5hbF8wMGU0ODYxNDBjYWRjNTNhNjJmYjJhZDE2ZjQ5M2YxOS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0',
            description: 'An aesthetic inspired by retro technology and 80s/90s nostalgia.',
            images: [
              { url: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzAxODc5Ni9vcmlnaW5hbF8wMGU0ODYxNDBjYWRjNTNhNjJmYjJhZDE2ZjQ5M2YxOS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0', title: 'Vaporwave 1' },
              { url: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzAxODc5Ni9vcmlnaW5hbF8wMGU0ODYxNDBjYWRjNTNhNjJmYjJhZDE2ZjQ5M2YxOS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0', title: 'Vaporwave 2' },
            ],
          },
          {
            name: 'Corporate Memphis',
            urlSlug: 'corporate-memphis',
            startYear: 'Late 2010s',
            endYear: 'Current',
            decadeYear: '2010s',
            displayImageUrl: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzA1NDA4OC9vcmlnaW5hbF82MjNkNWNkNGI4MjVjOGJkMjI5NWE3MjA1OGM2OGFkOS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0',
            description: 'A flat illustration style used heavily in tech company branding.',
            images: [
              { url: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzA1NDA4OC9vcmlnaW5hbF82MjNkNWNkNGI4MjVjOGJkMjI5NWE3MjA1OGM2OGFkOS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0', title: 'Corporate Memphis 1' },
              { url: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIxMzA1NDA4OC9vcmlnaW5hbF82MjNkNWNkNGI4MjVjOGJkMjI5NWE3MjA1OGM2OGFkOS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=0', title: 'Corporate Memphis 2' },
            ],
          },
        ],
        meh: [],
        nope: [],
      },
      insertionState: null,
      phase: 'done',
    },
    history: [],
  },
  version: 0,
};

test.describe('Mood Board & Share Card screenshots at 390×844', () => {
  test.beforeEach(async ({ page }) => {
    // Inject completed state before navigating
    await page.addInitScript((state) => {
      localStorage.setItem('aesthetic-ranker-beli', JSON.stringify(state));
    }, COMPLETED_STATE);
  });

  test('mood board renders correctly', async ({ page }) => {
    await page.goto('/aesthetic-ranker/#/results');
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: 'e2e/screenshots/mood-board.png',
      fullPage: true,
    });

    // Verify key elements
    await page.waitForSelector('text=This Is Your Aesthetic');
    await page.waitForSelector('text=Cassette Futurism');
    await page.waitForSelector('text=Vaporwave');
    await page.waitForSelector('text=Corporate Memphis');
    await page.waitForSelector('text=#1');
    await page.waitForSelector('text=#2');
    await page.waitForSelector('text=#3');
  });

  test('share card renders correctly', async ({ page }) => {
    await page.goto('/aesthetic-ranker/#/results');
    await page.waitForTimeout(1000);

    // Open share card
    await page.getByRole('button', { name: 'Share Results' }).click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'e2e/screenshots/share-card.png',
    });

    // Verify share card content
    await page.waitForSelector('text=My Top Aesthetics');
    await page.waitForSelector('text=tylerleonhardt.github.io/aesthetic-ranker');
  });
});
