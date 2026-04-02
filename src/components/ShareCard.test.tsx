// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ShareCard from './ShareCard';
import type { Aesthetic } from '../types';

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

  it('renders screenshot hint', () => {
    render(<ShareCard topThree={topThree} allBuckets={allBuckets} onClose={() => {}} />);
    expect(screen.getByText('Screenshot this card to share ✨')).toBeInTheDocument();
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
