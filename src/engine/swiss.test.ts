import { describe, it, expect } from 'vitest';
import type { Aesthetic, TournamentState } from '../types';
import {
  matchKey,
  initTournament,
  generateRound,
  recordResult,
  getTopN,
  isTournamentComplete,
  getCurrentMatchup,
} from './swiss';

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

describe('matchKey', () => {
  it('produces same result regardless of argument order', () => {
    expect(matchKey('alpha', 'beta')).toBe('alpha-vs-beta');
    expect(matchKey('beta', 'alpha')).toBe('alpha-vs-beta');
  });

  it('handles identical slugs', () => {
    expect(matchKey('same', 'same')).toBe('same-vs-same');
  });
});

describe('initTournament', () => {
  it('creates correct state with 90 aesthetics', () => {
    const aesthetics = makeAesthetics(90);
    const state = initTournament(aesthetics);

    expect(state.totalRounds).toBe(Math.ceil(Math.log2(90))); // 7
    expect(state.currentRound).toBe(1);
    expect(state.currentMatchupIndex).toBe(0);
    expect(state.matchHistory).toEqual([]);
    expect(state.currentMatchups.length).toBe(45); // 90 / 2
    expect(Object.keys(state.scores)).toHaveLength(90);
    // All scores start at 0
    for (const score of Object.values(state.scores)) {
      expect(score).toBe(0);
    }
  });

  it('calculates totalRounds correctly for various sizes', () => {
    expect(initTournament(makeAesthetics(2)).totalRounds).toBe(1);
    expect(initTournament(makeAesthetics(4)).totalRounds).toBe(2);
    expect(initTournament(makeAesthetics(8)).totalRounds).toBe(3);
    expect(initTournament(makeAesthetics(16)).totalRounds).toBe(4);
    expect(initTournament(makeAesthetics(10)).totalRounds).toBe(4); // ceil(log2(10)) = 4
  });
});

describe('generateRound', () => {
  it('produces floor(N/2) matchups for round 1 with even count', () => {
    const state = initTournament(makeAesthetics(20));
    expect(state.currentMatchups.length).toBe(10);
  });

  it('produces floor(N/2) matchups for round 1 with odd count', () => {
    const state = initTournament(makeAesthetics(21));
    expect(state.currentMatchups.length).toBe(10);
  });

  it('pairs adjacent entries by score', () => {
    const aesthetics = makeAesthetics(4);
    const state: TournamentState = {
      aesthetics,
      scores: {
        'aesthetic-000': 3,
        'aesthetic-001': 2,
        'aesthetic-002': 1,
        'aesthetic-003': 0,
      },
      matchHistory: [],
      currentRound: 2,
      totalRounds: 2,
      currentMatchups: [],
      currentMatchupIndex: 0,
    };

    const matchups = generateRound(state);
    // Sorted by score: 000(3), 001(2), 002(1), 003(0)
    // Pairs: 000 vs 001, 002 vs 003
    expect(matchups).toEqual([
      ['aesthetic-000', 'aesthetic-001'],
      ['aesthetic-002', 'aesthetic-003'],
    ]);
  });
});

describe('recordResult', () => {
  it('awards 1 point for a left win', () => {
    const state = initTournament(makeAesthetics(4));
    const [slugA] = state.currentMatchups[0];
    const [, slugB] = state.currentMatchups[0];

    const next = recordResult(state, 'left');
    expect(next.scores[slugA]).toBe(1);
    expect(next.scores[slugB]).toBe(0);
  });

  it('awards 1 point for a right win', () => {
    const state = initTournament(makeAesthetics(4));
    const [slugA, slugB] = state.currentMatchups[0];

    const next = recordResult(state, 'right');
    expect(next.scores[slugA]).toBe(0);
    expect(next.scores[slugB]).toBe(1);
  });

  it('awards 0.5 each for a draw', () => {
    const state = initTournament(makeAesthetics(4));
    const [slugA, slugB] = state.currentMatchups[0];

    const next = recordResult(state, 'draw');
    expect(next.scores[slugA]).toBe(0.5);
    expect(next.scores[slugB]).toBe(0.5);
  });

  it('adds matchup to matchHistory with canonical key', () => {
    const state = initTournament(makeAesthetics(4));
    const [slugA, slugB] = state.currentMatchups[0];

    const next = recordResult(state, 'left');
    const expectedKey = matchKey(slugA, slugB);
    expect(next.matchHistory).toContain(expectedKey);
  });

  it('advances currentMatchupIndex', () => {
    const state = initTournament(makeAesthetics(6));
    expect(state.currentMatchupIndex).toBe(0);

    const next = recordResult(state, 'left');
    expect(next.currentMatchupIndex).toBe(1);
  });

  it('advances to next round when all matchups in current round are done', () => {
    // 4 aesthetics = 2 rounds, 2 matchups per round
    const state = initTournament(makeAesthetics(4));
    expect(state.currentRound).toBe(1);
    expect(state.currentMatchups.length).toBe(2);

    let current = state;
    current = recordResult(current, 'left');
    expect(current.currentRound).toBe(1);

    current = recordResult(current, 'left');
    // Round 1 is done, should advance to round 2
    expect(current.currentRound).toBe(2);
    expect(current.currentMatchupIndex).toBe(0);
    expect(current.currentMatchups.length).toBe(2);
  });
});

describe('immutability', () => {
  it('recordResult returns a new state object without mutating the original', () => {
    const state = initTournament(makeAesthetics(4));
    const originalScores = { ...state.scores };
    const originalHistory = [...state.matchHistory];
    const originalIndex = state.currentMatchupIndex;
    const originalRound = state.currentRound;

    const next = recordResult(state, 'left');

    // Original state is unchanged
    expect(state.scores).toEqual(originalScores);
    expect(state.matchHistory).toEqual(originalHistory);
    expect(state.currentMatchupIndex).toBe(originalIndex);
    expect(state.currentRound).toBe(originalRound);

    // New state is a different object
    expect(next).not.toBe(state);
    expect(next.scores).not.toBe(state.scores);
    expect(next.matchHistory).not.toBe(state.matchHistory);
  });
});

describe('no rematches', () => {
  it('after multiple rounds, no pair appears in matchHistory twice', () => {
    const aesthetics = makeAesthetics(16);
    let state = initTournament(aesthetics);

    // Play through all rounds
    while (!isTournamentComplete(state)) {
      state = recordResult(state, 'left');
    }

    const seen = new Set<string>();
    for (const key of state.matchHistory) {
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('generateRound skips already-played pairs', () => {
    const aesthetics = makeAesthetics(4);
    // Manually set up a state where 000 vs 001 already played
    const state: TournamentState = {
      aesthetics,
      scores: {
        'aesthetic-000': 1,
        'aesthetic-001': 0,
        'aesthetic-002': 1,
        'aesthetic-003': 0,
      },
      matchHistory: [matchKey('aesthetic-000', 'aesthetic-001'), matchKey('aesthetic-002', 'aesthetic-003')],
      currentRound: 2,
      totalRounds: 2,
      currentMatchups: [],
      currentMatchupIndex: 0,
    };

    const matchups = generateRound(state);
    const keys = matchups.map(([a, b]) => matchKey(a, b));

    // The previously played pairs should not appear
    expect(keys).not.toContain(matchKey('aesthetic-000', 'aesthetic-001'));
    expect(keys).not.toContain(matchKey('aesthetic-002', 'aesthetic-003'));
  });
});

describe('bye handling', () => {
  it('with odd count, one aesthetic is unpaired each round', () => {
    const state = initTournament(makeAesthetics(5));
    // 5 aesthetics -> 2 matchups, 1 bye
    expect(state.currentMatchups.length).toBe(2);
  });

  it('bye recipient gets 1 point automatically on round advance', () => {
    // 3 aesthetics: 1 matchup + 1 bye per round, 2 total rounds
    const aesthetics = makeAesthetics(3);
    let state = initTournament(aesthetics);

    // Round 1: 1 matchup, 1 bye
    expect(state.currentMatchups.length).toBe(1);

    // Figure out who has the bye in round 1
    const pairedRound1 = new Set<string>();
    for (const [a, b] of state.currentMatchups) {
      pairedRound1.add(a);
      pairedRound1.add(b);
    }
    const byeSlugRound1 = aesthetics.find((a) => !pairedRound1.has(a.urlSlug))!.urlSlug;

    // Bye point is applied at round generation time
    expect(state.scores[byeSlugRound1]).toBe(1);

    // Record the matchup result to advance to round 2
    state = recordResult(state, 'left');

    // Bye recipient still has their point from round 1
    expect(state.scores[byeSlugRound1]).toBeGreaterThanOrEqual(1);
    expect(state.currentRound).toBe(2);
  });
});

describe('isTournamentComplete', () => {
  it('returns false during the tournament', () => {
    const state = initTournament(makeAesthetics(4));
    expect(isTournamentComplete(state)).toBe(false);
  });

  it('returns true when all rounds and matchups are done', () => {
    const aesthetics = makeAesthetics(4);
    let state = initTournament(aesthetics);

    while (!isTournamentComplete(state)) {
      state = recordResult(state, 'left');
    }

    expect(isTournamentComplete(state)).toBe(true);
  });

  it('returns true when currentRound exceeds totalRounds', () => {
    const state: TournamentState = {
      aesthetics: [],
      scores: {},
      matchHistory: [],
      currentRound: 5,
      totalRounds: 4,
      currentMatchups: [],
      currentMatchupIndex: 0,
    };
    expect(isTournamentComplete(state)).toBe(true);
  });
});

describe('getCurrentMatchup', () => {
  it('returns the current pair of Aesthetic objects', () => {
    const aesthetics = makeAesthetics(4);
    const state = initTournament(aesthetics);
    const matchup = getCurrentMatchup(state);

    expect(matchup).not.toBeNull();
    const [a, b] = matchup!;
    expect(a.urlSlug).toBe(state.currentMatchups[0][0]);
    expect(b.urlSlug).toBe(state.currentMatchups[0][1]);
  });

  it('returns null when tournament is complete', () => {
    let state = initTournament(makeAesthetics(4));
    while (!isTournamentComplete(state)) {
      state = recordResult(state, 'left');
    }
    expect(getCurrentMatchup(state)).toBeNull();
  });
});

describe('getTopN', () => {
  it('returns aesthetics sorted by score descending', () => {
    const aesthetics = makeAesthetics(4);
    const state: TournamentState = {
      aesthetics,
      scores: {
        'aesthetic-000': 1,
        'aesthetic-001': 3,
        'aesthetic-002': 0,
        'aesthetic-003': 2,
      },
      matchHistory: [],
      currentRound: 3,
      totalRounds: 2,
      currentMatchups: [],
      currentMatchupIndex: 0,
    };

    const top = getTopN(state, 4);
    expect(top[0].urlSlug).toBe('aesthetic-001'); // score 3
    expect(top[1].urlSlug).toBe('aesthetic-003'); // score 2
    expect(top[2].urlSlug).toBe('aesthetic-000'); // score 1
    expect(top[3].urlSlug).toBe('aesthetic-002'); // score 0
  });

  it('breaks ties alphabetically by name', () => {
    const aesthetics = makeAesthetics(3);
    const state: TournamentState = {
      aesthetics,
      scores: {
        'aesthetic-000': 1,
        'aesthetic-001': 1,
        'aesthetic-002': 1,
      },
      matchHistory: [],
      currentRound: 3,
      totalRounds: 2,
      currentMatchups: [],
      currentMatchupIndex: 0,
    };

    const top = getTopN(state, 3);
    expect(top[0].name).toBe('Aesthetic 000');
    expect(top[1].name).toBe('Aesthetic 001');
    expect(top[2].name).toBe('Aesthetic 002');
  });

  it('returns only N items', () => {
    const state = initTournament(makeAesthetics(20));
    const top5 = getTopN(state, 5);
    expect(top5).toHaveLength(5);
  });
});

describe('full simulation', () => {
  it('runs a complete tournament with 90 aesthetics using deterministic results', () => {
    const aesthetics = makeAesthetics(90);
    let state = initTournament(aesthetics);

    let totalMatchups = 0;
    while (!isTournamentComplete(state)) {
      // Deterministic: alternate left/right/draw
      const results: Array<'left' | 'right' | 'draw'> = ['left', 'right', 'draw'];
      state = recordResult(state, results[totalMatchups % 3]);
      totalMatchups++;
    }

    expect(isTournamentComplete(state)).toBe(true);
    expect(state.currentRound).toBe(state.totalRounds);

    const top10 = getTopN(state, 10);
    expect(top10).toHaveLength(10);

    // Verify scores are non-negative
    for (const score of Object.values(state.scores)) {
      expect(score).toBeGreaterThanOrEqual(0);
    }

    // Verify no duplicate match history entries
    const seen = new Set<string>();
    for (const key of state.matchHistory) {
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('runs a complete tournament with odd count (91 aesthetics)', () => {
    const aesthetics = makeAesthetics(91);
    let state = initTournament(aesthetics);

    let totalMatchups = 0;
    while (!isTournamentComplete(state)) {
      state = recordResult(state, totalMatchups % 2 === 0 ? 'left' : 'right');
      totalMatchups++;
    }

    expect(isTournamentComplete(state)).toBe(true);
    const top5 = getTopN(state, 5);
    expect(top5).toHaveLength(5);
  });

  it('accumulates scores across rounds correctly', () => {
    // 4 aesthetics, 2 rounds — always pick left winner
    const aesthetics = makeAesthetics(4);
    let state = initTournament(aesthetics);

    const allMatchups: [string, string][] = [];
    while (!isTournamentComplete(state)) {
      allMatchups.push(state.currentMatchups[state.currentMatchupIndex]);
      state = recordResult(state, 'left');
    }

    // Each left winner gets 1 point per match won
    let totalScore = 0;
    for (const score of Object.values(state.scores)) {
      totalScore += score;
    }
    // Total points distributed = number of matchups played (1 per match for wins)
    expect(totalScore).toBe(allMatchups.length);
  });
});
