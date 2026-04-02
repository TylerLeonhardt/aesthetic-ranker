import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Aesthetic, MatchResult, Phase, TournamentState } from '../types';
import {
  initTournament,
  recordResult,
  getTopN,
  isTournamentComplete,
  getCurrentMatchup,
} from '../engine/swiss';
import aestheticsData from '../data/aesthetics.json';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface TournamentStore {
  phase: Phase;
  tournament: TournamentState | null;
  startTournament: () => void;
  recordMatchResult: (result: MatchResult) => void;
  reset: () => void;
  getCurrentMatchup: () => [Aesthetic, Aesthetic] | null;
  getTopThree: () => Aesthetic[];
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      phase: 'landing',
      tournament: null,

      startTournament: () => {
        const shuffled = shuffle(aestheticsData as Aesthetic[]);
        const tournament = initTournament(shuffled);
        set({ phase: 'playing', tournament });
      },

      recordMatchResult: (result: MatchResult) => {
        const { tournament } = get();
        if (!tournament) return;

        const next = recordResult(tournament, result);
        if (isTournamentComplete(next)) {
          set({ tournament: next, phase: 'results' });
        } else {
          set({ tournament: next });
        }
      },

      reset: () => {
        set({ phase: 'landing', tournament: null });
      },

      getCurrentMatchup: () => {
        const { tournament } = get();
        if (!tournament) return null;
        return getCurrentMatchup(tournament);
      },

      getTopThree: () => {
        const { tournament } = get();
        if (!tournament) return [];
        return getTopN(tournament, 3);
      },
    }),
    { name: 'aesthetic-ranker-tournament' },
  ),
);

export default useTournamentStore;
