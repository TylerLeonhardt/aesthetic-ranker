import type { Aesthetic, MatchResult } from '../types';
import AestheticCard from './AestheticCard';
import SwipeContainer from './SwipeContainer';

interface MatchupViewProps {
  left: Aesthetic;
  right: Aesthetic;
  onResult: (result: MatchResult) => void;
}

export default function MatchupView({
  left,
  right,
  onResult,
}: MatchupViewProps) {
  const matchKey = `${left.name}-vs-${right.name}`;

  return (
    <div className="flex flex-col gap-4">
      <SwipeContainer
        onSwipeRight={() => onResult('left')}
        onSwipeLeft={() => onResult('right')}
        onSwipeUp={() => onResult('draw')}
      >
        <div
          key={matchKey}
          className="flex flex-col gap-3 md:flex-row md:gap-6 animate-fade-in"
        >
          {/* Left card */}
          <button
            type="button"
            onClick={() => onResult('left')}
            className="flex-1 cursor-pointer rounded-2xl ring-2 ring-transparent transition-all duration-200 hover:ring-indigo-400 focus:outline-none focus:ring-indigo-400 active:scale-[0.98]"
          >
            <AestheticCard aesthetic={left} className="w-full" />
          </button>

          {/* VS separator */}
          <div className="flex items-center justify-center md:flex-col">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-300">
              VS
            </div>
          </div>

          {/* Right card */}
          <button
            type="button"
            onClick={() => onResult('right')}
            className="flex-1 cursor-pointer rounded-2xl ring-2 ring-transparent transition-all duration-200 hover:ring-indigo-400 focus:outline-none focus:ring-indigo-400 active:scale-[0.98]"
          >
            <AestheticCard aesthetic={right} className="w-full" />
          </button>
        </div>
      </SwipeContainer>

      {/* Draw button */}
      <button
        type="button"
        onClick={() => onResult('draw')}
        className="mx-auto min-h-[44px] rounded-xl bg-slate-700 px-6 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600 active:bg-slate-500"
      >
        Too Hard to Choose
      </button>
    </div>
  );
}
