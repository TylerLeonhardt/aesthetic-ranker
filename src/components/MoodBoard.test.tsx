// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import MoodBoard from './MoodBoard';
import type { Aesthetic } from '../types';

function makeAesthetic(name: string, slug: string, imageCount = 4): Aesthetic {
  const images = Array.from({ length: imageCount }, (_, i) => ({
    url: `https://example.com/${slug}-${i + 1}.jpg`,
    title: `${name} Image ${i + 1}`,
  }));
  return {
    name,
    urlSlug: slug,
    startYear: '2000',
    endYear: '2020',
    decadeYear: '2000s',
    displayImageUrl: `https://example.com/${slug}.jpg`,
    images,
  };
}

const topThree = [
  makeAesthetic('Vaporwave', 'vaporwave', 5),
  makeAesthetic('Cottagecore', 'cottagecore', 3),
  makeAesthetic('Dark Academia', 'dark-academia', 2),
];

describe('MoodBoard', () => {
  afterEach(cleanup);

  it('renders all three aesthetic names', () => {
    render(<MoodBoard topThree={topThree} />);
    expect(screen.getByText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByText('Cottagecore')).toBeInTheDocument();
    expect(screen.getByText('Dark Academia')).toBeInTheDocument();
  });

  it('shows rank labels #1, #2, #3', () => {
    render(<MoodBoard topThree={topThree} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('renders hero images for #1 aesthetic', () => {
    render(<MoodBoard topThree={topThree} />);
    expect(screen.getByAltText('Vaporwave Image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Vaporwave Image 2')).toBeInTheDocument();
    expect(screen.getByAltText('Vaporwave Image 3')).toBeInTheDocument();
    expect(screen.getByAltText('Vaporwave Image 4')).toBeInTheDocument();
  });

  it('renders images for #2 and #3 aesthetics', () => {
    render(<MoodBoard topThree={topThree} />);
    expect(screen.getByAltText('Cottagecore Image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Cottagecore Image 2')).toBeInTheDocument();
    expect(screen.getByAltText('Dark Academia Image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Dark Academia Image 2')).toBeInTheDocument();
  });

  it('shows era info for each aesthetic', () => {
    render(<MoodBoard topThree={topThree} />);
    const yearTexts = screen.getAllByText('2000 – 2020');
    expect(yearTexts.length).toBe(3);
  });

  it('opens detail modal when hero section is tapped', () => {
    render(<MoodBoard topThree={topThree} />);
    // Click the hero section (contains #1 text)
    fireEvent.click(screen.getByText('#1').closest('button')!);
    // Detail modal should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens detail modal when runner-up is tapped', () => {
    render(<MoodBoard topThree={topThree} />);
    fireEvent.click(screen.getByText('#2').closest('button')!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows fallback message when fewer than 3 results', () => {
    render(<MoodBoard topThree={[topThree[0]]} />);
    expect(screen.getByText('Not enough results to display.')).toBeInTheDocument();
  });
});
