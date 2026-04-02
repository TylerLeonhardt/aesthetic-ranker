// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ShareCard from './ShareCard';
import type { Aesthetic } from '../types';

vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

import html2canvas from 'html2canvas';
const mockedHtml2canvas = vi.mocked(html2canvas);

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

const allBuckets = {
  like: [topThree[0], topThree[1], topThree[2]],
  meh: [],
  nope: [],
};

describe('ShareCard', () => {
  afterEach(cleanup);

  it('renders all three aesthetic names', () => {
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    expect(screen.getByText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByText('Cottagecore')).toBeInTheDocument();
    expect(screen.getByText('Dark Academia')).toBeInTheDocument();
  });

  it('shows the title "My Top 3 Aesthetics"', () => {
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    expect(screen.getByText('My Top 3 Aesthetics')).toBeInTheDocument();
  });

  it('shows percentages that sum to 100', () => {
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    // Same bucket → 50/30/20
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('shows the watermark URL', () => {
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    expect(screen.getByText('tylerleonhardt.github.io/aesthetic-ranker')).toBeInTheDocument();
  });

  it('renders the share card container', () => {
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    expect(screen.getByTestId('share-card')).toBeInTheDocument();
  });

  it('renders save image button', () => {
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    expect(screen.getByLabelText('Save image')).toBeInTheDocument();
    expect(screen.getByText('📥 Save Image')).toBeInTheDocument();
  });

  it('calls html2canvas and triggers download on save', async () => {
    const fakeCanvas = {
      toBlob: (cb: (blob: Blob | null) => void) => cb(null),
      toDataURL: () => 'data:image/png;base64,fake',
    };
    mockedHtml2canvas.mockResolvedValue(fakeCanvas as unknown as HTMLCanvasElement);

    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { click: clickSpy, set download(_v: string) {}, set href(_v: string) {} } as unknown as HTMLAnchorElement;
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
    });

    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(mockedHtml2canvas).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ useCORS: true, scale: 2 }),
      );
    });

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });

    vi.restoreAllMocks();
  });

  it('uses Web Share API when available with file support', async () => {
    const fakeBlob = new Blob(['fake'], { type: 'image/png' });
    const fakeCanvas = {
      toBlob: (cb: (blob: Blob | null) => void) => cb(fakeBlob),
      toDataURL: () => 'data:image/png;base64,fake',
    };
    mockedHtml2canvas.mockResolvedValue(fakeCanvas as unknown as HTMLCanvasElement);

    const shareFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', {
      value: () => true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: shareFn,
      configurable: true,
    });

    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(shareFn).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([expect.any(File)]),
          title: 'My Aesthetic',
        }),
      );
    });

    // Clean up navigator mocks
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    vi.restoreAllMocks();
  });

  it('falls back to download when user cancels Web Share', async () => {
    const fakeBlob = new Blob(['fake'], { type: 'image/png' });
    const fakeCanvas = {
      toBlob: (cb: (blob: Blob | null) => void) => cb(fakeBlob),
      toDataURL: () => 'data:image/png;base64,fake',
    };
    mockedHtml2canvas.mockResolvedValue(fakeCanvas as unknown as HTMLCanvasElement);

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

    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(shareFn).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });

    // Clean up navigator mocks
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    vi.restoreAllMocks();
  });

  it('shows hero images for each aesthetic', () => {
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    expect(screen.getByAltText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByAltText('Cottagecore')).toBeInTheDocument();
    expect(screen.getByAltText('Dark Academia')).toBeInTheDocument();
  });

  it('closes on backdrop click', () => {
    let closed = false;
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => { closed = true; }} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(closed).toBe(true);
  });

  it('closes on close button click', () => {
    let closed = false;
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => { closed = true; }} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(closed).toBe(true);
  });

  it('has accessible dialog role', () => {
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
