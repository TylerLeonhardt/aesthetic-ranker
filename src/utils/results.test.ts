// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { calculatePercentages, getMoodBoardImages } from './results';
import type { Aesthetic } from '../types';

function makeAesthetic(name: string, slug: string, images?: { url: string; title: string }[]): Aesthetic {
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

describe('calculatePercentages', () => {
  it('returns 50/30/20 when all top 3 are in the same bucket', () => {
    const a = makeAesthetic('A', 'a');
    const b = makeAesthetic('B', 'b');
    const c = makeAesthetic('C', 'c');
    const buckets = { like: [a, b, c], meh: [], nope: [] };

    expect(calculatePercentages([a, b, c], buckets)).toEqual([50, 30, 20]);
  });

  it('returns 50/30/20 when all in meh bucket', () => {
    const a = makeAesthetic('A', 'a');
    const b = makeAesthetic('B', 'b');
    const c = makeAesthetic('C', 'c');
    const buckets = { like: [], meh: [a, b, c], nope: [] };

    expect(calculatePercentages([a, b, c], buckets)).toEqual([50, 30, 20]);
  });

  it('gives higher percentage to higher-tier bucket items', () => {
    const a = makeAesthetic('A', 'a');
    const b = makeAesthetic('B', 'b');
    const c = makeAesthetic('C', 'c');
    const buckets = { like: [a, b], meh: [c], nope: [] };

    const result = calculatePercentages([a, b, c], buckets);
    expect(result).toHaveLength(3);
    expect(result[0]).toBeGreaterThan(result[2]);
    expect(result.reduce((sum, p) => sum + p, 0)).toBe(100);
  });

  it('always sums to exactly 100', () => {
    const a = makeAesthetic('A', 'a');
    const b = makeAesthetic('B', 'b');
    const c = makeAesthetic('C', 'c');
    const buckets = { like: [a], meh: [b], nope: [c] };

    const result = calculatePercentages([a, b, c], buckets);
    expect(result.reduce((sum, p) => sum + p, 0)).toBe(100);
  });

  it('returns empty array for fewer than 3 items', () => {
    const a = makeAesthetic('A', 'a');
    expect(calculatePercentages([a], { like: [a], meh: [], nope: [] })).toEqual([]);
  });
});

describe('getMoodBoardImages', () => {
  it('returns up to count images from the images array', () => {
    const images = [
      { url: 'https://example.com/1.jpg', title: 'Img 1' },
      { url: 'https://example.com/2.jpg', title: 'Img 2' },
      { url: 'https://example.com/3.jpg', title: 'Img 3' },
    ];
    const aesthetic = makeAesthetic('Test', 'test', images);

    expect(getMoodBoardImages(aesthetic, 2)).toEqual([images[0], images[1]]);
    expect(getMoodBoardImages(aesthetic, 5)).toEqual(images);
  });

  it('falls back to displayImageUrl when no images array', () => {
    const aesthetic = makeAesthetic('Test', 'test');
    const result = getMoodBoardImages(aesthetic, 3);

    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.com/test.jpg');
    expect(result[0].title).toBe('Test');
  });

  it('falls back to displayImageUrl when images array is empty', () => {
    const aesthetic = makeAesthetic('Test', 'test', []);
    const result = getMoodBoardImages(aesthetic, 3);

    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.com/test.jpg');
  });
});
