import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Aesthetic, BucketName, CompareResult, RankerPhase, RankerState } from '../types';
import {
  initRanker,
  bucketAesthetic,
  compareResult as processComparison,
  getTopN,
  getCurrentComparison,
  getProgress,
} from '../engine/beli';
import aestheticsData from '../data/aesthetics.json';

type AppPhase = 'landing' | 'ranking' | 'results';

interface RankerStore {
  appPhase: AppPhase;
  ranker: RankerState | null;

  // Actions
  startRanking: () => void;
  bucketCurrent: (bucket: BucketName) => void;
  recordComparison: (result: CompareResult) => void;
  reset: () => void;

  // Derived getters
  getCurrentAesthetic: () => Aesthetic | null;
  getCurrentComparison: () => { newItem: Aesthetic; existingItem: Aesthetic } | null;
  getInsertionBucket: () => BucketName | null;
  getTopThree: () => Aesthetic[];
  getAllRanked: () => { like: Aesthetic[]; meh: Aesthetic[]; nope: Aesthetic[] };
  getProgress: () => { completed: number; total: number };
  getRankerPhase: () => RankerPhase | null;
}

export const useRankerStore = create<RankerStore>()(
  persist(
    (set, get) => ({
      appPhase: 'landing',
      ranker: null,

      startRanking: () => {
        const ranker = initRanker(aestheticsData as Aesthetic[]);
        set({ appPhase: 'ranking', ranker });
      },

      bucketCurrent: (bucket) => {
        const { ranker } = get();
        if (!ranker) return;
        const next = bucketAesthetic(ranker, bucket);
        if (next.phase === 'done') {
          set({ ranker: next, appPhase: 'results' });
        } else {
          set({ ranker: next });
        }
      },

      recordComparison: (result) => {
        const { ranker } = get();
        if (!ranker) return;
        const next = processComparison(ranker, result);
        if (next.phase === 'done') {
          set({ ranker: next, appPhase: 'results' });
        } else {
          set({ ranker: next });
        }
      },

      reset: () => set({ appPhase: 'landing', ranker: null }),

      getCurrentAesthetic: () => {
        const { ranker } = get();
        if (!ranker || ranker.phase !== 'bucketing') return null;
        return ranker.aesthetics[ranker.currentIndex] ?? null;
      },

      getCurrentComparison: () => {
        const { ranker } = get();
        if (!ranker) return null;
        return getCurrentComparison(ranker);
      },

      getInsertionBucket: () => {
        const { ranker } = get();
        if (!ranker?.insertionState) return null;
        return ranker.insertionState.bucket;
      },

      getTopThree: () => {
        const { ranker } = get();
        if (!ranker) return [];
        return getTopN(ranker, 3);
      },

      getAllRanked: () => {
        const { ranker } = get();
        if (!ranker) return { like: [], meh: [], nope: [] };
        return { ...ranker.buckets };
      },

      getProgress: () => {
        const { ranker } = get();
        if (!ranker) return { completed: 0, total: 0 };
        return getProgress(ranker);
      },

      getRankerPhase: () => {
        const { ranker } = get();
        return ranker?.phase ?? null;
      },
    }),
    { name: 'aesthetic-ranker-beli' },
  ),
);

// Keep backward-compatible default export
export default useRankerStore;
