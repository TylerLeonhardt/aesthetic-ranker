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
});
