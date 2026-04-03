// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ShareCard from './ShareCard';
import type { Aesthetic } from '../types';

vi.mock('./renderShareCard', () => ({
  renderShareCard: vi.fn(),
}));

import { renderShareCard } from './renderShareCard';
const mockedRenderShareCard = vi.mocked(renderShareCard);

function makeAesthetic(name: string, slug: string): Aesthetic {
  return {
    name,
    urlSlug: slug,
    startYear: '2000',
    endYear: '2020',
    decadeYear: '2000s',
    displayImageUrl: `https://example.com/${slug}.jpg`,
    images: [
      { url: `https://example.com/${slug}-1.jpg`, title: `${name} 1` },
    ],
  };
}

const topThree = [
  makeAesthetic('Vaporwave', 'vaporwave'),
  makeAesthetic('Cottagecore', 'cottagecore'),
  makeAesthetic('Dark Academia', 'dark-academia'),
];

const bottomThree = [
  makeAesthetic('Diner Kitsch', 'diner-kitsch'),
  makeAesthetic('Corporate Hippie', 'corporate-hippie'),
  makeAesthetic('Dollar Store', 'dollar-store'),
];

// Helper: mock fetch + URL.createObjectURL for blob URL pre-fetching
function mockBlobPrefetch() {
  const fakeBlob = new Blob(['fake-image'], { type: 'image/jpeg' });
  const fetchMock = vi.fn().mockResolvedValue({
    blob: () => Promise.resolve(fakeBlob),
  });
  vi.stubGlobal('fetch', fetchMock);

  let blobCounter = 0;
  const createObjectURLMock = vi.fn().mockImplementation(() => `blob:http://localhost/${++blobCounter}`);
  const revokeObjectURLMock = vi.fn();
  vi.stubGlobal('URL', {
    ...globalThis.URL,
    createObjectURL: createObjectURLMock,
    revokeObjectURL: revokeObjectURLMock,
  });

  return { fetchMock, createObjectURLMock, revokeObjectURLMock };
}

// Helper: render and wait for images to load
async function renderAndWaitForImages(ui: React.ReactElement) {
  const result = render(ui);
  await waitFor(() => {
    expect(screen.getByText('📥 Save Image')).toBeInTheDocument();
  });
  return result;
}

describe('ShareCard', () => {
  beforeEach(() => {
    mockBlobPrefetch();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders top 3 aesthetic names with medal labels', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByText('Cottagecore')).toBeInTheDocument();
    expect(screen.getByText('Dark Academia')).toBeInTheDocument();
  });

  it('shows the title "My Top Aesthetics"', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByText('My Top Aesthetics')).toBeInTheDocument();
  });

  it('shows bottom 3 "Not My Vibe" section', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByText('Not My Vibe')).toBeInTheDocument();
    expect(screen.getByText('Diner Kitsch')).toBeInTheDocument();
    expect(screen.getByText('Corporate Hippie')).toBeInTheDocument();
    expect(screen.getByText('Dollar Store')).toBeInTheDocument();
  });

  it('hides "Not My Vibe" section when bottomThree is empty', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={[]} onClose={() => {}} />);
    expect(screen.queryByText('Not My Vibe')).not.toBeInTheDocument();
  });

  it('does not show percentages', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    const card = screen.getByTestId('share-card');
    expect(card.textContent).not.toMatch(/\d+%/);
  });

  it('shows the watermark URL', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByText('tylerleonhardt.github.io/aesthetic-ranker')).toBeInTheDocument();
  });

  it('renders the share card container', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByTestId('share-card')).toBeInTheDocument();
  });

  it('renders save image button after images load', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByLabelText('Save image')).toBeInTheDocument();
    expect(screen.getByText('📥 Save Image')).toBeInTheDocument();
  });

  it('shows loading state while images are pre-fetching', () => {
    // Use a fetch that never resolves to keep loading state
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.getByLabelText('Save image')).toBeDisabled();
  });

  it('pre-fetches images as blob URLs on mount', async () => {
    const { fetchMock, createObjectURLMock } = mockBlobPrefetch();
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);

    // Should fetch each unique image URL from the top 3
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(createObjectURLMock).toHaveBeenCalledTimes(3);
  });

  it('uses blob URLs as image sources after pre-fetch', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);

    const images = screen.getAllByRole('img');
    images.forEach((img) => {
      expect(img.getAttribute('src')).toMatch(/^blob:/);
    });
  });

  it('does not set crossOrigin on images', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);

    const images = screen.getAllByRole('img');
    images.forEach((img) => {
      expect(img).not.toHaveAttribute('crossOrigin');
    });
  });

  it('falls back to original URL when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    vi.stubGlobal('URL', {
      ...globalThis.URL,
      createObjectURL: vi.fn(),
      revokeObjectURL: vi.fn(),
    });

    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);

    const images = screen.getAllByRole('img');
    images.forEach((img) => {
      expect(img.getAttribute('src')).toMatch(/^https:\/\/example\.com\//);
    });
  });

  it('calls renderShareCard and triggers download on save', async () => {
    const fakeCanvas = {
      toBlob: (cb: (blob: Blob | null) => void) => cb(null),
      toDataURL: () => 'data:image/png;base64,fake',
    };
    mockedRenderShareCard.mockResolvedValue(fakeCanvas as unknown as HTMLCanvasElement);

    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { click: clickSpy, set download(_v: string) {}, set href(_v: string) {} } as unknown as HTMLAnchorElement;
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
    });

    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(mockedRenderShareCard).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('uses Web Share API when available with file support', async () => {
    const fakeBlob = new Blob(['fake'], { type: 'image/png' });
    const fakeCanvas = {
      toBlob: (cb: (blob: Blob | null) => void) => cb(fakeBlob),
      toDataURL: () => 'data:image/png;base64,fake',
    };
    mockedRenderShareCard.mockResolvedValue(fakeCanvas as unknown as HTMLCanvasElement);

    const shareFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', {
      value: () => true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: shareFn,
      configurable: true,
    });

    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(shareFn).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([expect.any(File)]),
          title: 'My Aesthetic Ranking',
        }),
      );
    });

    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });

  it('falls back to download when user cancels Web Share', async () => {
    const fakeBlob = new Blob(['fake'], { type: 'image/png' });
    const fakeCanvas = {
      toBlob: (cb: (blob: Blob | null) => void) => cb(fakeBlob),
      toDataURL: () => 'data:image/png;base64,fake',
    };
    mockedRenderShareCard.mockResolvedValue(fakeCanvas as unknown as HTMLCanvasElement);

    const shareFn = vi.fn().mockRejectedValue(new DOMException('Share canceled', 'AbortError'));
    Object.defineProperty(navigator, 'canShare', {
      value: () => true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: shareFn,
      configurable: true,
    });

    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { click: clickSpy, set download(_v: string) {}, set href(_v: string) {} } as unknown as HTMLAnchorElement;
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
    });

    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(shareFn).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });

    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });

  it('falls back to URL share when renderShareCard fails and share API available', async () => {
    mockedRenderShareCard.mockRejectedValue(new Error('Canvas rendering failed'));

    const shareFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareFn,
      configurable: true,
    });

    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(shareFn).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://tylerleonhardt.github.io/aesthetic-ranker',
          title: 'My Aesthetic Ranking',
        }),
      );
    });

    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });

  it('falls back to clipboard when renderShareCard and share both fail', async () => {
    mockedRenderShareCard.mockRejectedValue(new Error('Canvas rendering failed'));

    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(new Error('Share failed')),
      configurable: true,
    });

    const clipboardSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardSpy },
      configurable: true,
    });

    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(screen.getByTestId('share-error')).toHaveTextContent(
        'Could not generate image. Link copied to clipboard!',
      );
    });

    expect(clipboardSpy).toHaveBeenCalledWith('https://tylerleonhardt.github.io/aesthetic-ranker');

    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('shows fallback error when canvas, share, and clipboard all fail', async () => {
    mockedRenderShareCard.mockRejectedValue(new Error('Canvas rendering failed'));
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')) },
      configurable: true,
    });

    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(screen.getByTestId('share-error')).toHaveTextContent(
        'Save failed: Canvas rendering failed',
      );
    });

    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('shows hero images for top 3 aesthetics', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByAltText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByAltText('Cottagecore')).toBeInTheDocument();
    expect(screen.getByAltText('Dark Academia')).toBeInTheDocument();
  });

  it('closes on backdrop click', async () => {
    let closed = false;
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => { closed = true; }} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(closed).toBe(true);
  });

  it('closes on close button click', async () => {
    let closed = false;
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => { closed = true; }} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(closed).toBe(true);
  });

  it('has accessible dialog role', async () => {
    await renderAndWaitForImages(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
