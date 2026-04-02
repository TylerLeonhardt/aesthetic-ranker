import type { Aesthetic, BucketName, CompareResult, RankerState, InsertionState } from '../types';

/** Shuffle array using Fisher-Yates */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Insert an aesthetic into a bucket at a specific position, returning a new array */
function insertAt(bucket: Aesthetic[], item: Aesthetic, position: number): Aesthetic[] {
  const result = [...bucket];
  result.splice(position, 0, item);
  return result;
}

/** Advance state after an insertion completes */
function advanceAfterInsertion(state: RankerState, bucketName: BucketName, newBucket: Aesthetic[]): RankerState {
  const nextIndex = state.currentIndex + 1;
  return {
    ...state,
    currentIndex: nextIndex,
    buckets: {
      ...state.buckets,
      [bucketName]: newBucket,
    },
    insertionState: null,
    phase: nextIndex >= state.aesthetics.length ? 'done' : 'bucketing',
  };
}

/** Initialize a new ranker with shuffled aesthetics */
export function initRanker(aesthetics: Aesthetic[]): RankerState {
  return {
    aesthetics: shuffle(aesthetics),
    currentIndex: 0,
    buckets: {
      like: [],
      meh: [],
      nope: [],
    },
    insertionState: null,
    phase: aesthetics.length === 0 ? 'done' : 'bucketing',
  };
}

/** Place the current aesthetic into a bucket. Returns new state. */
export function bucketAesthetic(state: RankerState, bucket: BucketName): RankerState {
  const aesthetic = state.aesthetics[state.currentIndex];
  const targetBucket = state.buckets[bucket];

  if (targetBucket.length === 0) {
    return advanceAfterInsertion(state, bucket, [aesthetic]);
  }

  const low = 0;
  const high = targetBucket.length;
  const compareIndex = Math.floor((low + high) / 2);
  const insertion: InsertionState = { aesthetic, bucket, low, high, compareIndex };

  return {
    ...state,
    insertionState: insertion,
    phase: 'comparing',
  };
}

/** Process a comparison result during binary search insertion. */
export function compareResult(state: RankerState, result: CompareResult): RankerState {
  const ins = state.insertionState!;
  const bucket = state.buckets[ins.bucket];

  // Tie: insert immediately after the compared item
  if (result === 'tie') {
    const newBucket = insertAt(bucket, ins.aesthetic, ins.compareIndex + 1);
    return advanceAfterInsertion(state, ins.bucket, newBucket);
  }

  const newLow = result === 'worse' ? ins.compareIndex + 1 : ins.low;
  const newHigh = result === 'better' ? ins.compareIndex : ins.high;

  if (newLow >= newHigh) {
    const newBucket = insertAt(bucket, ins.aesthetic, newLow);
    return advanceAfterInsertion(state, ins.bucket, newBucket);
  }

  const newCompareIndex = Math.floor((newLow + newHigh) / 2);
  const newInsertion: InsertionState = {
    ...ins,
    low: newLow,
    high: newHigh,
    compareIndex: newCompareIndex,
  };

  return {
    ...state,
    insertionState: newInsertion,
  };
}

/** Get top N aesthetics: likes first (best→worst), then mehs, then nopes */
export function getTopN(state: RankerState, n: number): Aesthetic[] {
  const all = [...state.buckets.like, ...state.buckets.meh, ...state.buckets.nope];
  return all.slice(0, n);
}

/** Get the current comparison pair, or null if not comparing */
export function getCurrentComparison(state: RankerState): { newItem: Aesthetic; existingItem: Aesthetic } | null {
  if (state.phase !== 'comparing' || !state.insertionState) return null;

  const ins = state.insertionState;
  const bucket = state.buckets[ins.bucket];
  return {
    newItem: ins.aesthetic,
    existingItem: bucket[ins.compareIndex],
  };
}

/** Get progress: how many aesthetics have been fully placed */
export function getProgress(state: RankerState): { completed: number; total: number } {
  const completed = state.buckets.like.length + state.buckets.meh.length + state.buckets.nope.length;
  return { completed, total: state.aesthetics.length };
}
