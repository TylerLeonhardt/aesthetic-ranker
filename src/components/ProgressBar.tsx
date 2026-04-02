interface ProgressBarProps {
  currentRound: number;
  totalRounds: number;
  currentMatchup: number;
  totalMatchups: number;
}

export default function ProgressBar({
  currentRound,
  totalRounds,
  currentMatchup,
  totalMatchups,
}: ProgressBarProps) {
  const progress =
    totalMatchups > 0 ? Math.min((currentMatchup / totalMatchups) * 100, 100) : 0;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Round {currentRound}/{totalRounds}
        </span>
        <span>
          Match {Math.min(currentMatchup + 1, totalMatchups)}/{totalMatchups}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
