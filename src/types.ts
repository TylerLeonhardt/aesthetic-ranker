export interface Aesthetic {
  name: string;
  urlSlug: string;
  startYear: string;
  endYear: string;
  decadeYear: string;
  displayImageUrl: string;
}

export type BucketName = 'like' | 'meh' | 'nope';
export type CompareResult = 'better' | 'worse' | 'tie';
export type RankerPhase = 'bucketing' | 'comparing' | 'done';

export interface InsertionState {
  aesthetic: Aesthetic;
  bucket: BucketName;
  low: number;
  high: number;
  compareIndex: number;
}

export interface RankerState {
  aesthetics: Aesthetic[];
  currentIndex: number;
  buckets: {
    like: Aesthetic[];
    meh: Aesthetic[];
    nope: Aesthetic[];
  };
  insertionState: InsertionState | null;
  phase: RankerPhase;
}


