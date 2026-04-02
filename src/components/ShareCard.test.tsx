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

const topTen = [
  makeAesthetic('Vaporwave', 'vaporwave'),
  makeAesthetic('Cottagecore', 'cottagecore'),
  makeAesthetic('Dark Academia', 'dark-academia'),
  makeAesthetic('Synthwave', 'synthwave'),
  makeAesthetic('Cyberdelia', 'cyberdelia'),
  makeAesthetic('Memphis', 'memphis'),
  makeAesthetic('Blob World', 'blob-world'),
  makeAesthetic('Airbrush Surrealism', 'airbrush-surrealism'),
  makeAesthetic('Decoplex', 'decoplex'),
  makeAesthetic('Diner Kitsch', 'diner-kitsch'),
];

const topThreeOnly = topTen.slice(0, 3);

describe('ShareCard', () => {
  afterEach(cleanup);

  it('renders top 3 aesthetic names with medal labels', () => {
    render(<ShareCard topTen={topTen} onClose={() => {}} />);
    expect(screen.getByText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByText('Cottagecore')).toBeInTheDocument();
    expect(screen.getByText('Dark Academia')).toBeInTheDocument();
  });

  it('shows the title "My Top Aesthetics"', () => {
    render(<ShareCard topTen={topTen} onClose={() => {}} />);
    expect(screen.getByText('My Top Aesthetics')).toBeInTheDocument();
  });

  it('shows rank numbers for items 4-10', () => {
    render(<ShareCard topTen={topTen} onClose={() => {}} />);
    expect(screen.getByText('4.')).toBeInTheDocument();
    expect(screen.getByText('10.')).toBeInTheDocument();
    expect(screen.getByText('Synthwave')).toBeInTheDocument();
    expect(screen.getByText('Diner Kitsch')).toBeInTheDocument();
  });

  it('does not show percentages', () => {
    render(<ShareCard topTen={topTen} onClose={() => {}} />);
    // No percentage text should be present
    const card = screen.getByTestId('share-card');
    expect(card.textContent).not.toMatch(/\d+%/);
  });

  it('shows the watermark URL', () => {
    render(<ShareCard topTen={topTen} onClose={() => {}} />);
    expect(screen.getByText('tylerleonhardt.github.io/aesthetic-ranker')).toBeInTheDocument();
  });

  it('renders the share card container', () => {
    render(<ShareCard topTen={topTen} onClose={() => {}} />);
    expect(screen.getByTestId('share-card')).toBeInTheDocument();
  });

  it('renders save image button', () => {
    render(<ShareCard topTen={topTen} onClose={() => {}} />);
    expect(screen.getByLabelText('Save image')).toBeInTheDocument();
    expect(screen.getByText('📥 Save Image')).toBeInTheDocument();
  });

  it('calls html2canvas with allowTaint and triggers download on save', async () => {
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

    render(<ShareCard topTen={topTen} onClose={() => {}} />);
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

    render(<ShareCard topTen={topTen} onClose={() => {}} />);
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

    render(<ShareCard topTen={topTen} onClose={() => {}} />);
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

  it('shows error message when html2canvas fails and clipboard works', async () => {
    mockedHtml2canvas.mockRejectedValue(new Error('Canvas rendering failed'));
    const clipboardSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardSpy },
      configurable: true,
    });

    render(<ShareCard topTen={topTen} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Save image'));

    await waitFor(() => {
      expect(screen.getByTestId('share-error')).toHaveTextContent(
        'Could not generate image. Link copied to clipboard!',
      );
    });

    expect(clipboardSpy).toHaveBeenCalledWith('https://tylerleonhardt.github.io/aesthetic-ranker');

    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    vi.restoreAllMocks();
  });

  it('shows fallback error when both canvas and clipboard fail', async () => {
    mockedHtml2canvas.mockRejectedValue(new Error('Canvas rendering failed'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')) },
      configurable: true,
    });

    render(<ShareCard topTen={topTen} onClose={() => {}} />);
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
    render(<ShareCard topTen={topTen} onClose={() => {}} />);
    expect(screen.getByAltText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByAltText('Cottagecore')).toBeInTheDocument();
    expect(screen.getByAltText('Dark Academia')).toBeInTheDocument();
  });

  it('works with exactly 3 aesthetics (no #4-10 section)', () => {
    render(<ShareCard topTen={topThreeOnly} onClose={() => {}} />);
    expect(screen.getByText('Vaporwave')).toBeInTheDocument();
    // Should not show any numbered items (4. through 10.)
    expect(screen.queryByText('4.')).not.toBeInTheDocument();
  });

  it('closes on backdrop click', () => {
    let closed = false;
    render(<ShareCard topTen={topTen} onClose={() => { closed = true; }} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(closed).toBe(true);
  });

  it('closes on close button click', () => {
    let closed = false;
    render(<ShareCard topTen={topTen} onClose={() => { closed = true; }} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(closed).toBe(true);
  });

  it('has accessible dialog role', () => {
    render(<ShareCard topTen={topTen} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
