import type { Aesthetic, MatchResult, TournamentState } from '../types';

/** Canonical matchup key: sort slugs alphabetically, join with "-vs-" */
export function matchKey(a: string, b: string): string {
  return a < b ? `${a}-vs-${b}` : `${b}-vs-${a}`;
}

/** Initialize a new Swiss tournament from a list of aesthetics */
export function initTournament(aesthetics: Aesthetic[]): TournamentState {
  const scores: Record<string, number> = {};
  for (const a of aesthetics) {
    scores[a.urlSlug] = 0;
  }

  const totalRounds = Math.ceil(Math.log2(aesthetics.length));

  const state: TournamentState = {
    aesthetics,
    scores,
    matchHistory: [],
    currentRound: 1,
    totalRounds,
    currentMatchups: [],
    currentMatchupIndex: 0,
  };

  const matchups = generateRound(state);
  const scoresWithByes = applyByes(state, matchups);

  return {
    ...state,
    scores: scoresWithByes,
    currentMatchups: matchups,
  };
}

/** Generate matchups for the current round using Swiss pairing */
export function generateRound(state: TournamentState): [string, string][] {
  const { aesthetics, scores, matchHistory } = state;

  // Sort by score descending, then alphabetically by slug for tiebreaking
  const sorted = [...aesthetics]
    .map((a) => a.urlSlug)
    .sort((a, b) => {
      const scoreDiff = (scores[b] ?? 0) - (scores[a] ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.localeCompare(b);
    });

  const historySet = new Set(matchHistory);
  const paired = new Set<string>();
  const matchups: [string, string][] = [];
  const byeRecipients: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const slugA = sorted[i];
    if (paired.has(slugA)) continue;

    let foundOpponent = false;
    for (let j = i + 1; j < sorted.length; j++) {
      const slugB = sorted[j];
      if (paired.has(slugB)) continue;

      const key = matchKey(slugA, slugB);
      if (historySet.has(key)) continue;

      matchups.push([slugA, slugB]);
      paired.add(slugA);
      paired.add(slugB);
      foundOpponent = true;
      break;
    }

    if (!foundOpponent) {
      byeRecipients.push(slugA);
    }
  }

  // Bye recipients get recorded but don't produce matchups.
  // The caller handles bye scoring via the returned matchups + state update.
  // We store bye info by convention: byes are handled in recordResult's round-advance logic,
  // but we need to apply them now since generateRound is called at round boundaries.
  // We'll return matchups and handle byes separately in the state update.
  // Actually, let's keep generateRound pure — byes are applied by the callers
  // (initTournament and recordResult) after calling generateRound.

  return matchups;
}

/** Apply bye points for unpaired aesthetics in the current round */
function applyByes(state: TournamentState, matchups: [string, string][]): Record<string, number> {
  const paired = new Set<string>();
  for (const [a, b] of matchups) {
    paired.add(a);
    paired.add(b);
  }

  const newScores = { ...state.scores };
  for (const aesthetic of state.aesthetics) {
    if (!paired.has(aesthetic.urlSlug)) {
      newScores[aesthetic.urlSlug] = (newScores[aesthetic.urlSlug] ?? 0) + 1;
    }
  }
  return newScores;
}

/** Record the result of the current matchup and advance state */
export function recordResult(state: TournamentState, result: MatchResult): TournamentState {
  const { currentMatchups, currentMatchupIndex } = state;
  const [slugA, slugB] = currentMatchups[currentMatchupIndex];

  // Update scores
  const newScores = { ...state.scores };
  if (result === 'left') {
    newScores[slugA] = (newScores[slugA] ?? 0) + 1;
  } else if (result === 'right') {
    newScores[slugB] = (newScores[slugB] ?? 0) + 1;
  } else {
    newScores[slugA] = (newScores[slugA] ?? 0) + 0.5;
    newScores[slugB] = (newScores[slugB] ?? 0) + 0.5;
  }

  // Add to match history
  const key = matchKey(slugA, slugB);
  const newHistory = [...state.matchHistory, key];

  const newMatchupIndex = currentMatchupIndex + 1;

  // Check if round is complete
  if (newMatchupIndex >= currentMatchups.length && state.currentRound < state.totalRounds) {
    // Advance to next round
    const intermediateState: TournamentState = {
      ...state,
      scores: newScores,
      matchHistory: newHistory,
      currentRound: state.currentRound + 1,
      currentMatchups: [],
      currentMatchupIndex: 0,
    };

    const nextMatchups = generateRound(intermediateState);
    const scoresWithByes = applyByes(intermediateState, nextMatchups);

    return {
      ...intermediateState,
      scores: scoresWithByes,
      currentMatchups: nextMatchups,
    };
  }

  return {
    ...state,
    scores: newScores,
    matchHistory: newHistory,
    currentMatchupIndex: newMatchupIndex,
  };
}

/** Get top N aesthetics sorted by score (desc), then name (asc) for tiebreaking */
export function getTopN(state: TournamentState, n: number): Aesthetic[] {
  return [...state.aesthetics]
    .sort((a, b) => {
      const scoreDiff = (state.scores[b.urlSlug] ?? 0) - (state.scores[a.urlSlug] ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name);
    })
    .slice(0, n);
}

/** Check if the tournament is complete */
export function isTournamentComplete(state: TournamentState): boolean {
  if (state.currentRound > state.totalRounds) return true;
  if (
    state.currentRound === state.totalRounds &&
    state.currentMatchupIndex >= state.currentMatchups.length
  ) {
    return true;
  }
  return false;
}

/** Get the current matchup as Aesthetic objects, or null if tournament is complete */
export function getCurrentMatchup(state: TournamentState): [Aesthetic, Aesthetic] | null {
  if (isTournamentComplete(state)) return null;

  const { currentMatchups, currentMatchupIndex, aesthetics } = state;
  if (currentMatchupIndex >= currentMatchups.length) return null;

  const [slugA, slugB] = currentMatchups[currentMatchupIndex];
  const aestheticA = aesthetics.find((a) => a.urlSlug === slugA);
  const aestheticB = aesthetics.find((a) => a.urlSlug === slugB);

  if (!aestheticA || !aestheticB) return null;

  return [aestheticA, aestheticB];
}
