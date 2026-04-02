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

const bottomThree = [
  makeAesthetic('Diner Kitsch', 'diner-kitsch'),
  makeAesthetic('Corporate Hippie', 'corporate-hippie'),
  makeAesthetic('Dollar Store', 'dollar-store'),
];

describe('ShareCard', () => {
  afterEach(cleanup);

  it('renders top 3 aesthetic names with medal labels', () => {
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByText('Cottagecore')).toBeInTheDocument();
    expect(screen.getByText('Dark Academia')).toBeInTheDocument();
  });

  it('shows the title "My Top Aesthetics"', () => {
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByText('My Top Aesthetics')).toBeInTheDocument();
  });

  it('shows bottom 3 "Not My Vibe" section', () => {
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByText('Not My Vibe')).toBeInTheDocument();
    expect(screen.getByText('Diner Kitsch')).toBeInTheDocument();
    expect(screen.getByText('Corporate Hippie')).toBeInTheDocument();
    expect(screen.getByText('Dollar Store')).toBeInTheDocument();
  });

  it('hides "Not My Vibe" section when bottomThree is empty', () => {
    render(<ShareCard topThree={topThree} bottomThree={[]} onClose={() => {}} />);
    expect(screen.queryByText('Not My Vibe')).not.toBeInTheDocument();
  });

  it('does not show percentages', () => {
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    const card = screen.getByTestId('share-card');
    expect(card.textContent).not.toMatch(/\d+%/);
  });

  it('shows the watermark URL', () => {
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByText('tylerleonhardt.github.io/aesthetic-ranker')).toBeInTheDocument();
  });

  it('renders the share card container', () => {
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByTestId('share-card')).toBeInTheDocument();
  });

  it('renders save image button', () => {
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
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

    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
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

    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(shareFn).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([expect.any(File)]),
          title: 'My Aesthetic Ranking',
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

    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
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

  it('falls back to URL share when html2canvas fails and share API available', async () => {
    mockedHtml2canvas.mockRejectedValue(new Error('Canvas rendering failed'));

    const shareFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareFn,
      configurable: true,
    });

    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
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
    vi.restoreAllMocks();
  });

  it('falls back to clipboard when html2canvas and share both fail', async () => {
    mockedHtml2canvas.mockRejectedValue(new Error('Canvas rendering failed'));

    // share rejects too
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(new Error('Share failed')),
      configurable: true,
    });

    const clipboardSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardSpy },
      configurable: true,
    });

    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(screen.getByTestId('share-error')).toHaveTextContent(
        'Could not generate image. Link copied to clipboard!',
      );
    });

    expect(clipboardSpy).toHaveBeenCalledWith('https://tylerleonhardt.github.io/aesthetic-ranker');

    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    vi.restoreAllMocks();
  });

  it('shows fallback error when canvas, share, and clipboard all fail', async () => {
    mockedHtml2canvas.mockRejectedValue(new Error('Canvas rendering failed'));
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')) },
      configurable: true,
    });

    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(screen.getByTestId('share-error')).toHaveTextContent(
        'Could not save image. Try taking a screenshot instead.',
      );
    });

    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    vi.restoreAllMocks();
  });

  it('shows hero images for top 3 aesthetics', () => {
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    expect(screen.getByAltText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByAltText('Cottagecore')).toBeInTheDocument();
    expect(screen.getByAltText('Dark Academia')).toBeInTheDocument();
  });

  it('closes on backdrop click', () => {
    let closed = false;
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => { closed = true; }} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(closed).toBe(true);
  });

  it('closes on close button click', () => {
    let closed = false;
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => { closed = true; }} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(closed).toBe(true);
  });

  it('has accessible dialog role', () => {
    render(<ShareCard topThree={topThree} bottomThree={bottomThree} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
