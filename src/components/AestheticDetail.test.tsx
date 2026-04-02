// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AestheticDetail from './AestheticDetail';
import type { Aesthetic } from '../types';

const stubAesthetic: Aesthetic = {
  name: 'Vaporwave',
  urlSlug: 'vaporwave',
  startYear: '2010',
  endYear: '2019',
  decadeYear: '2010s',
  displayImageUrl: 'https://example.com/vaporwave.jpg',
  description: 'A retro-futuristic aesthetic.',
};

const stubNoDescription: Aesthetic = {
  name: 'Cottagecore',
  urlSlug: 'cottagecore',
  startYear: '2018',
  endYear: 'Current',
  decadeYear: '2010s',
  displayImageUrl: 'https://example.com/cottagecore.jpg',
};

describe('AestheticDetail', () => {
  afterEach(cleanup);

  it('displays the description when available', () => {
    render(<AestheticDetail aesthetic={stubAesthetic} onClose={() => {}} />);
    expect(screen.getByText('A retro-futuristic aesthetic.')).toBeInTheDocument();
  });

  it('shows CARI attribution below description', () => {
    render(<AestheticDetail aesthetic={stubAesthetic} onClose={() => {}} />);
    expect(screen.getByText('Description from CARI Institute')).toBeInTheDocument();
  });

  it('does not show description or attribution when no description', () => {
    render(<AestheticDetail aesthetic={stubNoDescription} onClose={() => {}} />);
    expect(screen.queryByText('Description from CARI Institute')).not.toBeInTheDocument();
  });

  it('displays aesthetic name and year range', () => {
    render(<AestheticDetail aesthetic={stubAesthetic} onClose={() => {}} />);
    expect(screen.getByText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByText('2010 – 2019')).toBeInTheDocument();
  });
});
