import { describe, it, expect } from 'vitest';
import type { Aesthetic, RankerState } from '../types';
import {
  initRanker,
  bucketAesthetic,
  compareResult,
  getTopN,
  getCurrentComparison,
  getProgress,
} from './beli';

/** Helper: create N mock aesthetics */
function makeAesthetics(n: number): Aesthetic[] {
  return Array.from({ length: n }, (_, i) => ({
    name: `Aesthetic ${String(i).padStart(3, '0')}`,
    urlSlug: `aesthetic-${String(i).padStart(3, '0')}`,
    startYear: '2000',
    endYear: '2010',
    decadeYear: '2000s',
    displayImageUrl: `https://example.com/${i}.jpg`,
  }));
}

/** Helper: build a deterministic state (no shuffle) for precise tests */
function makeDeterministicState(aesthetics: Aesthetic[]): RankerState {
  return {
    aesthetics,
    currentIndex: 0,
    buckets: { like: [], meh: [], nope: [] },
    insertionState: null,
    phase: aesthetics.length === 0 ? 'done' : 'bucketing',
  };
}

describe('initRanker', () => {
  it('creates correct initial state', () => {
    const aesthetics = makeAesthetics(10);
    const state = initRanker(aesthetics);

    expect(state.currentIndex).toBe(0);
    expect(state.buckets.like).toEqual([]);
    expect(state.buckets.meh).toEqual([]);
    expect(state.buckets.nope).toEqual([]);
    expect(state.insertionState).toBeNull();
    expect(state.phase).toBe('bucketing');
  });

  it('shuffles aesthetics (different order from input)', () => {
    const aesthetics = makeAesthetics(50);
    const state = initRanker(aesthetics);

    // Shuffled array has same elements
    expect(state.aesthetics).toHaveLength(50);
    const sortedInput = [...aesthetics].map((a) => a.urlSlug).sort();
    const sortedState = [...state.aesthetics].map((a) => a.urlSlug).sort();
    expect(sortedState).toEqual(sortedInput);

    // Very unlikely to be identical order (50! permutations)
    const isIdentical = state.aesthetics.every((a, i) => a.urlSlug === aesthetics[i].urlSlug);
    expect(isIdentical).toBe(false);
  });

  it('all buckets are empty initially', () => {
    const state = initRanker(makeAesthetics(5));
    expect(state.buckets.like).toHaveLength(0);
    expect(state.buckets.meh).toHaveLength(0);
    expect(state.buckets.nope).toHaveLength(0);
  });

  it('handles empty input', () => {
    const state = initRanker([]);
    expect(state.phase).toBe('done');
    expect(state.aesthetics).toHaveLength(0);
  });
});

describe('first item in empty bucket', () => {
  it('inserts directly without comparison', () => {
    const aesthetics = makeAesthetics(3);
    const state = makeDeterministicState(aesthetics);

    const next = bucketAesthetic(state, 'like');

    expect(next.buckets.like).toHaveLength(1);
    expect(next.buckets.like[0]).toBe(aesthetics[0]);
    expect(next.currentIndex).toBe(1);
    expect(next.insertionState).toBeNull();
    expect(next.phase).toBe('bucketing');
  });

  it('advances to done when last aesthetic placed in empty bucket', () => {
    const aesthetics = makeAesthetics(1);
    const state = makeDeterministicState(aesthetics);

    const next = bucketAesthetic(state, 'meh');

    expect(next.buckets.meh).toHaveLength(1);
    expect(next.phase).toBe('done');
    expect(next.currentIndex).toBe(1);
  });
});

describe('second item triggers comparison', () => {
  it('sets up binary search when bucket has 1 item', () => {
    const aesthetics = makeAesthetics(3);
    let state = makeDeterministicState(aesthetics);

    // First item goes straight in
    state = bucketAesthetic(state, 'like');
    expect(state.buckets.like).toHaveLength(1);

    // Second item triggers comparison
    state = bucketAesthetic(state, 'like');
    expect(state.phase).toBe('comparing');
    expect(state.insertionState).not.toBeNull();
    expect(state.insertionState!.low).toBe(0);
    expect(state.insertionState!.high).toBe(1);
    expect(state.insertionState!.compareIndex).toBe(0);
    expect(state.insertionState!.aesthetic).toBe(aesthetics[1]);
  });

  it('comparison "better" inserts before existing item', () => {
    const aesthetics = makeAesthetics(3);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'like');
    state = bucketAesthetic(state, 'like');
    state = compareResult(state, 'better');

    // high = compareIndex = 0, low = 0, low >= high → insert at 0
    expect(state.buckets.like).toHaveLength(2);
    expect(state.buckets.like[0]).toBe(aesthetics[1]); // new item is best
    expect(state.buckets.like[1]).toBe(aesthetics[0]); // old item second
    expect(state.phase).toBe('bucketing');
    expect(state.insertionState).toBeNull();
  });

  it('comparison "worse" inserts after existing item', () => {
    const aesthetics = makeAesthetics(3);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'like');
    state = bucketAesthetic(state, 'like');
    state = compareResult(state, 'worse');

    // low = compareIndex + 1 = 1, high = 1, low >= high → insert at 1
    expect(state.buckets.like).toHaveLength(2);
    expect(state.buckets.like[0]).toBe(aesthetics[0]); // old item stays best
    expect(state.buckets.like[1]).toBe(aesthetics[1]); // new item after
    expect(state.phase).toBe('bucketing');
  });

  it('comparison "tie" inserts after compared item', () => {
    const aesthetics = makeAesthetics(3);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'like');
    state = bucketAesthetic(state, 'like');
    state = compareResult(state, 'tie');

    // Tie: insert at compareIndex + 1 = 1
    expect(state.buckets.like).toHaveLength(2);
    expect(state.buckets.like[0]).toBe(aesthetics[0]);
    expect(state.buckets.like[1]).toBe(aesthetics[1]);
    expect(state.phase).toBe('bucketing');
  });
});

describe('third item binary search', () => {
  it('finds correct position with 1-2 comparisons', () => {
    const aesthetics = makeAesthetics(4);
    let state = makeDeterministicState(aesthetics);

    // Build a bucket of 2: [A0, A1] (A0 best, A1 worst)
    state = bucketAesthetic(state, 'like'); // A0 straight in
    state = bucketAesthetic(state, 'like'); // A1 triggers comparison
    state = compareResult(state, 'worse');  // A1 after A0 → [A0, A1]

    expect(state.buckets.like).toEqual([aesthetics[0], aesthetics[1]]);

    // Third item A2 into 'like' bucket of 2 items
    state = bucketAesthetic(state, 'like');
    expect(state.phase).toBe('comparing');
    expect(state.insertionState!.low).toBe(0);
    expect(state.insertionState!.high).toBe(2);
    expect(state.insertionState!.compareIndex).toBe(1); // mid of [0,2)

    // Say A2 is better than A1 (item at index 1)
    state = compareResult(state, 'better');
    // high = 1, low = 0, compareIndex = 0
    expect(state.insertionState).not.toBeNull();
    expect(state.insertionState!.low).toBe(0);
    expect(state.insertionState!.high).toBe(1);
    expect(state.insertionState!.compareIndex).toBe(0);

    // Say A2 is worse than A0 (item at index 0)
    state = compareResult(state, 'worse');
    // low = 1, high = 1, low >= high → insert at 1
    expect(state.buckets.like).toEqual([aesthetics[0], aesthetics[2], aesthetics[1]]);
    expect(state.phase).toBe('bucketing');
  });

  it('inserts at beginning when always better', () => {
    const aesthetics = makeAesthetics(4);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'nope');
    state = bucketAesthetic(state, 'nope');
    state = compareResult(state, 'worse');
    // nope: [A0, A1]

    state = bucketAesthetic(state, 'nope');
    // Compare with A1 (index 1): better
    state = compareResult(state, 'better');
    // Compare with A0 (index 0): better
    state = compareResult(state, 'better');

    // A2 is the best → position 0
    expect(state.buckets.nope[0]).toBe(aesthetics[2]);
    expect(state.buckets.nope[1]).toBe(aesthetics[0]);
    expect(state.buckets.nope[2]).toBe(aesthetics[1]);
  });

  it('inserts at end when always worse', () => {
    const aesthetics = makeAesthetics(4);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'meh');
    state = bucketAesthetic(state, 'meh');
    state = compareResult(state, 'worse');
    // meh: [A0, A1]

    state = bucketAesthetic(state, 'meh');
    // Compare with A1 (index 1): worse
    state = compareResult(state, 'worse');

    // low = 2, high = 2 → insert at 2
    expect(state.buckets.meh).toEqual([aesthetics[0], aesthetics[1], aesthetics[2]]);
  });
});

describe('getTopN', () => {
  it('returns likes first, then mehs, then nopes', () => {
    const aesthetics = makeAesthetics(6);
    const state: RankerState = {
      aesthetics,
      currentIndex: 6,
      buckets: {
        like: [aesthetics[2], aesthetics[0]],
        meh: [aesthetics[4]],
        nope: [aesthetics[1], aesthetics[3], aesthetics[5]],
      },
      insertionState: null,
      phase: 'done',
    };

    const top = getTopN(state, 6);
    expect(top).toEqual([
      aesthetics[2], aesthetics[0],  // likes
      aesthetics[4],                  // mehs
      aesthetics[1], aesthetics[3], aesthetics[5], // nopes
    ]);
  });

  it('returns only n items', () => {
    const aesthetics = makeAesthetics(6);
    const state: RankerState = {
      aesthetics,
      currentIndex: 6,
      buckets: {
        like: [aesthetics[0], aesthetics[1]],
        meh: [aesthetics[2], aesthetics[3]],
        nope: [aesthetics[4], aesthetics[5]],
      },
      insertionState: null,
      phase: 'done',
    };

    const top3 = getTopN(state, 3);
    expect(top3).toHaveLength(3);
    expect(top3).toEqual([aesthetics[0], aesthetics[1], aesthetics[2]]);
  });

  it('works with mixed empty buckets', () => {
    const aesthetics = makeAesthetics(3);
    const state: RankerState = {
      aesthetics,
      currentIndex: 3,
      buckets: {
        like: [],
        meh: [aesthetics[0], aesthetics[1], aesthetics[2]],
        nope: [],
      },
      insertionState: null,
      phase: 'done',
    };

    const top = getTopN(state, 10);
    expect(top).toHaveLength(3);
    expect(top).toEqual([aesthetics[0], aesthetics[1], aesthetics[2]]);
  });

  it('handles n larger than total aesthetics', () => {
    const aesthetics = makeAesthetics(2);
    const state: RankerState = {
      aesthetics,
      currentIndex: 2,
      buckets: {
        like: [aesthetics[0]],
        meh: [],
        nope: [aesthetics[1]],
      },
      insertionState: null,
      phase: 'done',
    };

    const top = getTopN(state, 100);
    expect(top).toHaveLength(2);
    expect(top[0]).toBe(aesthetics[0]);
    expect(top[1]).toBe(aesthetics[1]);
  });
});

describe('getCurrentComparison', () => {
  it('returns correct pair during comparing phase', () => {
    const aesthetics = makeAesthetics(3);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'like'); // A0 in
    state = bucketAesthetic(state, 'like'); // triggers comparison

    const comparison = getCurrentComparison(state);
    expect(comparison).not.toBeNull();
    expect(comparison!.newItem).toBe(aesthetics[1]);
    expect(comparison!.existingItem).toBe(aesthetics[0]);
  });

  it('returns null during bucketing phase', () => {
    const state = makeDeterministicState(makeAesthetics(3));
    expect(getCurrentComparison(state)).toBeNull();
  });

  it('returns null when done', () => {
    const aesthetics = makeAesthetics(1);
    let state = makeDeterministicState(aesthetics);
    state = bucketAesthetic(state, 'like');
    expect(state.phase).toBe('done');
    expect(getCurrentComparison(state)).toBeNull();
  });
});

describe('getProgress', () => {
  it('returns 0/N initially', () => {
    const state = makeDeterministicState(makeAesthetics(10));
    const progress = getProgress(state);
    expect(progress).toEqual({ completed: 0, total: 10 });
  });

  it('counts placed aesthetics across all buckets', () => {
    const aesthetics = makeAesthetics(5);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'like');
    expect(getProgress(state)).toEqual({ completed: 1, total: 5 });

    state = bucketAesthetic(state, 'meh');
    expect(getProgress(state)).toEqual({ completed: 2, total: 5 });

    state = bucketAesthetic(state, 'nope');
    expect(getProgress(state)).toEqual({ completed: 3, total: 5 });
  });

  it('does not count item being compared as completed', () => {
    const aesthetics = makeAesthetics(3);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'like');
    state = bucketAesthetic(state, 'like'); // comparing phase
    expect(state.phase).toBe('comparing');
    expect(getProgress(state)).toEqual({ completed: 1, total: 3 });
  });

  it('returns N/N when done', () => {
    const aesthetics = makeAesthetics(3);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'like');
    state = bucketAesthetic(state, 'meh');
    state = bucketAesthetic(state, 'nope');

    expect(state.phase).toBe('done');
    expect(getProgress(state)).toEqual({ completed: 3, total: 3 });
  });
});

describe('full simulation', () => {
  it('completes all 90 aesthetics with deterministic bucketing and comparison', () => {
    const aesthetics = makeAesthetics(90);
    let state = makeDeterministicState(aesthetics);

    const bucketChoices: Array<'like' | 'meh' | 'nope'> = ['like', 'meh', 'nope'];

    while (state.phase !== 'done') {
      if (state.phase === 'bucketing') {
        const bucket = bucketChoices[state.currentIndex % 3];
        state = bucketAesthetic(state, bucket);
      } else {
        // Always say 'worse' to put items at the end
        state = compareResult(state, 'worse');
      }
    }

    const progress = getProgress(state);
    expect(progress.completed).toBe(90);
    expect(progress.total).toBe(90);

    // Each bucket should have ~30 items
    expect(state.buckets.like).toHaveLength(30);
    expect(state.buckets.meh).toHaveLength(30);
    expect(state.buckets.nope).toHaveLength(30);

    // getTopN returns all 90
    const all = getTopN(state, 90);
    expect(all).toHaveLength(90);

    // Order: likes first, mehs, nopes
    for (let i = 0; i < 30; i++) {
      expect(all[i]).toBe(state.buckets.like[i]);
    }
    for (let i = 0; i < 30; i++) {
      expect(all[30 + i]).toBe(state.buckets.meh[i]);
    }
    for (let i = 0; i < 30; i++) {
      expect(all[60 + i]).toBe(state.buckets.nope[i]);
    }
  });

  it('completes 90 aesthetics using initRanker (shuffled)', () => {
    const aesthetics = makeAesthetics(90);
    let state = initRanker(aesthetics);
    let iterations = 0;
    const maxIterations = 10000;

    while (state.phase !== 'done' && iterations < maxIterations) {
      if (state.phase === 'bucketing') {
        const buckets: Array<'like' | 'meh' | 'nope'> = ['like', 'meh', 'nope'];
        state = bucketAesthetic(state, buckets[state.currentIndex % 3]);
      } else {
        state = compareResult(state, iterations % 2 === 0 ? 'better' : 'worse');
      }
      iterations++;
    }

    expect(state.phase).toBe('done');
    expect(getProgress(state).completed).toBe(90);
    expect(iterations).toBeLessThan(maxIterations);
  });

  it('all items into single bucket with binary search', () => {
    const aesthetics = makeAesthetics(10);
    let state = makeDeterministicState(aesthetics);

    while (state.phase !== 'done') {
      if (state.phase === 'bucketing') {
        state = bucketAesthetic(state, 'like');
      } else {
        state = compareResult(state, 'worse');
      }
    }

    expect(state.buckets.like).toHaveLength(10);
    expect(state.buckets.meh).toHaveLength(0);
    expect(state.buckets.nope).toHaveLength(0);

    // Since always 'worse', items should be in original order
    for (let i = 0; i < 10; i++) {
      expect(state.buckets.like[i]).toBe(aesthetics[i]);
    }
  });

  it('all items into single bucket with "better" creates reverse order', () => {
    const aesthetics = makeAesthetics(10);
    let state = makeDeterministicState(aesthetics);

    while (state.phase !== 'done') {
      if (state.phase === 'bucketing') {
        state = bucketAesthetic(state, 'like');
      } else {
        state = compareResult(state, 'better');
      }
    }

    expect(state.buckets.like).toHaveLength(10);
    // Always 'better' means each new item goes to the top
    // Last item placed should be at index 0
    expect(state.buckets.like[0]).toBe(aesthetics[9]);
  });
});

describe('immutability', () => {
  it('bucketAesthetic returns new state without mutating original', () => {
    const aesthetics = makeAesthetics(3);
    const state = makeDeterministicState(aesthetics);

    const originalBuckets = { ...state.buckets };
    const originalLike = [...state.buckets.like];

    const next = bucketAesthetic(state, 'like');

    expect(next).not.toBe(state);
    expect(state.buckets.like).toEqual(originalLike);
    expect(state.buckets).toEqual(originalBuckets);
    expect(state.currentIndex).toBe(0);
    expect(state.phase).toBe('bucketing');
  });

  it('compareResult returns new state without mutating original', () => {
    const aesthetics = makeAesthetics(3);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'like');
    state = bucketAesthetic(state, 'like');
    // Now in comparing phase

    const stateBeforeCompare = { ...state };
    const insertionBefore = { ...state.insertionState! };
    const bucketsBefore = { ...state.buckets };
    const likeBefore = [...state.buckets.like];

    const next = compareResult(state, 'better');

    expect(next).not.toBe(state);
    expect(state.insertionState!.low).toBe(insertionBefore.low);
    expect(state.insertionState!.high).toBe(insertionBefore.high);
    expect(state.buckets.like).toEqual(likeBefore);
    expect(state.currentIndex).toBe(stateBeforeCompare.currentIndex);
    expect(state.buckets).toEqual(bucketsBefore);
  });

  it('getTopN does not mutate bucket arrays', () => {
    const aesthetics = makeAesthetics(4);
    const state: RankerState = {
      aesthetics,
      currentIndex: 4,
      buckets: {
        like: [aesthetics[0], aesthetics[1]],
        meh: [aesthetics[2]],
        nope: [aesthetics[3]],
      },
      insertionState: null,
      phase: 'done',
    };

    const likeBefore = [...state.buckets.like];
    const mehBefore = [...state.buckets.meh];
    const nopeBefore = [...state.buckets.nope];

    getTopN(state, 4);

    expect(state.buckets.like).toEqual(likeBefore);
    expect(state.buckets.meh).toEqual(mehBefore);
    expect(state.buckets.nope).toEqual(nopeBefore);
  });
});

describe('done phase', () => {
  it('is reached when all aesthetics are bucketed and placed', () => {
    const aesthetics = makeAesthetics(3);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'like');
    expect(state.phase).toBe('bucketing');

    state = bucketAesthetic(state, 'meh');
    expect(state.phase).toBe('bucketing');

    state = bucketAesthetic(state, 'nope');
    expect(state.phase).toBe('done');
  });

  it('is reached after final comparison completes', () => {
    const aesthetics = makeAesthetics(2);
    let state = makeDeterministicState(aesthetics);

    state = bucketAesthetic(state, 'like');
    state = bucketAesthetic(state, 'like'); // comparing
    expect(state.phase).toBe('comparing');

    state = compareResult(state, 'better');
    expect(state.phase).toBe('done');
  });

  it('empty input is immediately done', () => {
    const state = initRanker([]);
    expect(state.phase).toBe('done');
    expect(getProgress(state)).toEqual({ completed: 0, total: 0 });
  });

  it('single item is done after one bucket', () => {
    const aesthetics = makeAesthetics(1);
    let state = makeDeterministicState(aesthetics);
    state = bucketAesthetic(state, 'nope');
    expect(state.phase).toBe('done');
    expect(getProgress(state)).toEqual({ completed: 1, total: 1 });
  });
});
