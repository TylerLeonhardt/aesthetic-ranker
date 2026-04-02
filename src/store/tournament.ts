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
  pushHistory,
  undoLastAction,
} from '../engine/beli';
import aestheticsData from '../data/aesthetics.json';

type AppPhase = 'landing' | 'ranking' | 'results';

interface RankerStore {
  appPhase: AppPhase;
  ranker: RankerState | null;
  history: RankerState[];

  // Actions
  startRanking: () => void;
  bucketCurrent: (bucket: BucketName) => void;
  recordComparison: (result: CompareResult) => void;
  undo: () => void;
  reset: () => void;

  // Derived getters
  getCurrentAesthetic: () => Aesthetic | null;
  getCurrentComparison: () => { newItem: Aesthetic; existingItem: Aesthetic } | null;
  getInsertionBucket: () => BucketName | null;
  getTopThree: () => Aesthetic[];
  getAllRanked: () => { like: Aesthetic[]; meh: Aesthetic[]; nope: Aesthetic[] };
  getProgress: () => { completed: number; total: number };
  getRankerPhase: () => RankerPhase | null;
  canUndo: () => boolean;
}

export const useRankerStore = create<RankerStore>()(
  persist(
    (set, get) => ({
      appPhase: 'landing',
      ranker: null,
      history: [],

      startRanking: () => {
        const ranker = initRanker(aestheticsData as Aesthetic[]);
        set({ appPhase: 'ranking', ranker, history: [] });
      },

      bucketCurrent: (bucket) => {
        const { ranker, history } = get();
        if (!ranker) return;
        const next = bucketAesthetic(ranker, bucket);
        const nextHistory = pushHistory(history, ranker);
        if (next.phase === 'done') {
          set({ ranker: next, appPhase: 'results', history: nextHistory });
        } else {
          set({ ranker: next, history: nextHistory });
        }
      },

      recordComparison: (result) => {
        const { ranker, history } = get();
        if (!ranker) return;
        const next = processComparison(ranker, result);
        const nextHistory = pushHistory(history, ranker);
        if (next.phase === 'done') {
          set({ ranker: next, appPhase: 'results', history: nextHistory });
        } else {
          set({ ranker: next, history: nextHistory });
        }
      },

      undo: () => {
        const { history } = get();
        const result = undoLastAction(history);
        if (!result) return;
        set({ ranker: result.state, history: result.history, appPhase: 'ranking' });
      },

      reset: () => set({ appPhase: 'landing', ranker: null, history: [] }),

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

      canUndo: () => get().history.length > 0,
    }),
    { name: 'aesthetic-ranker-beli' },
  ),
);

// Keep backward-compatible default export
export default useRankerStore;
