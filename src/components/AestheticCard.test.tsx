// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AestheticCard from './AestheticCard';
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

const stubWithImages: Aesthetic = {
  name: 'Vaporwave',
  urlSlug: 'vaporwave',
  startYear: '2010',
  endYear: '2019',
  decadeYear: '2010s',
  displayImageUrl: 'https://example.com/vaporwave.jpg',
  description: 'A retro-futuristic aesthetic.',
  images: [
    { url: 'https://example.com/1.jpg', title: 'Image 1' },
    { url: 'https://example.com/2.jpg', title: 'Image 2' },
    { url: 'https://example.com/3.jpg', title: 'Image 3' },
  ],
};

describe('AestheticCard', () => {
  afterEach(cleanup);
  it('renders the aesthetic name and year range', () => {
    render(<AestheticCard aesthetic={stubAesthetic} />);
    expect(screen.getByText('Vaporwave')).toBeInTheDocument();
    expect(screen.getByText('2010 – 2019')).toBeInTheDocument();
  });

  it('does not render the info button when onInfoTap is not provided', () => {
    render(<AestheticCard aesthetic={stubAesthetic} />);
    expect(screen.queryByLabelText('Details for Vaporwave')).not.toBeInTheDocument();
  });

  it('renders the info button when onInfoTap is provided', () => {
    render(<AestheticCard aesthetic={stubAesthetic} onInfoTap={() => {}} />);
    const btn = screen.getByLabelText('Details for Vaporwave');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('h-11', 'w-11'); // 44px touch target (2.75rem)
  });

  it('calls onInfoTap when the info button is clicked', () => {
    const onInfoTap = vi.fn();
    render(<AestheticCard aesthetic={stubAesthetic} onInfoTap={onInfoTap} />);
    fireEvent.click(screen.getByLabelText('Details for Vaporwave'));
    expect(onInfoTap).toHaveBeenCalledOnce();
  });

  it('stops click propagation so parent handlers are not triggered', () => {
    const onInfoTap = vi.fn();
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <AestheticCard aesthetic={stubAesthetic} onInfoTap={onInfoTap} />
      </div>,
    );

    fireEvent.click(screen.getByLabelText('Details for Vaporwave'));
    expect(onInfoTap).toHaveBeenCalledOnce();
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('stops pointerDown propagation to prevent swipe handling', () => {
    const onInfoTap = vi.fn();
    const parentPointerDown = vi.fn();

    render(
      <div onPointerDown={parentPointerDown}>
        <AestheticCard aesthetic={stubAesthetic} onInfoTap={onInfoTap} />
      </div>,
    );

    fireEvent.pointerDown(screen.getByLabelText('Details for Vaporwave'));
    expect(parentPointerDown).not.toHaveBeenCalled();
  });

  it('uses portrait aspect ratio by default', () => {
    const { container } = render(<AestheticCard aesthetic={stubAesthetic} />);
    const imageContainer = container.querySelector('[class*="aspect-"]');
    expect(imageContainer?.className).toContain('aspect-[3/4]');
  });

  it('uses landscape aspect ratio in compact variant', () => {
    const { container } = render(<AestheticCard aesthetic={stubAesthetic} variant="compact" />);
    const imageContainer = container.querySelector('[class*="aspect-"]');
    expect(imageContainer?.className).toContain('aspect-[4/3]');
  });

  it('shows carousel dots and swipe hint when aesthetic has multiple images', () => {
    render(<AestheticCard aesthetic={stubWithImages} />);
    expect(screen.getByText('← more images →')).toBeInTheDocument();
    expect(screen.getByLabelText('Image 1 of 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Image 2 of 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Image 3 of 3')).toBeInTheDocument();
  });

  it('does not show carousel dots for single-image aesthetic', () => {
    render(<AestheticCard aesthetic={stubAesthetic} />);
    expect(screen.queryByText('← more images →')).not.toBeInTheDocument();
  });
});
