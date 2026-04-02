export interface Aesthetic {
  name: string;
  urlSlug: string;
  startYear: string;
  endYear: string;
  decadeYear: string;
  displayImageUrl: string;
}

export interface TournamentState {
  aesthetics: Aesthetic[];
  scores: Record<string, number>;
  matchHistory: string[];
  currentRound: number;
  totalRounds: number;
  currentMatchups: [string, string][];
  currentMatchupIndex: number;
}

export type MatchResult = 'left' | 'right' | 'draw';

export type Phase = 'landing' | 'playing' | 'results';
