import { useNavigate } from 'react-router-dom';
import { useRankerStore } from '../store/tournament';

export default function Landing() {
  const { startRanking, ranker, appPhase } = useRankerStore();
  const navigate = useNavigate();

  const hasInProgress = appPhase === 'ranking' && ranker !== null;

  const handleStart = () => {
    startRanking();
    navigate('/play');
  };

  const handleResume = () => {
    navigate('/play');
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Find Your Aesthetic
      </h1>

      <p className="mt-4 max-w-md text-lg text-slate-400">
        See aesthetics one at a time. Like them, meh them, or nope them.
        We'll ask you to compare within each group to find your true top 3.
        90 styles from{' '}
        <a
          href="https://cari.institute"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
        >
          CARI Institute
        </a>
        .
      </p>

      <div className="mt-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleStart}
          className="min-h-[44px] rounded-xl bg-indigo-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-500 active:bg-indigo-700"
        >
          Start Ranking
        </button>

        {hasInProgress && (
          <button
            type="button"
            onClick={handleResume}
            className="min-h-[44px] rounded-xl bg-slate-700 px-8 py-3 text-base font-medium text-slate-300 transition-colors hover:bg-slate-600"
          >
            Resume Ranking
          </button>
        )}
      </div>
    </div>
  );
}
