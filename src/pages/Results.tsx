import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournamentStore } from '../store/tournament';
import ResultsPodium from '../components/ResultsPodium';

export default function Results() {
  const { phase, reset, getTopThree } = useTournamentStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const topThree = getTopThree();

  useEffect(() => {
    if (phase !== 'results' || topThree.length < 3) {
      navigate('/', { replace: true });
    }
  }, [phase, topThree, navigate]);

  if (phase !== 'results' || topThree.length < 3) return null;

  const handleShare = async () => {
    const text = [
      '🎨 My Top 3 Aesthetics:',
      `🥇 ${topThree[0].name}`,
      `🥈 ${topThree[1].name}`,
      `🥉 ${topThree[2].name}`,
      '',
      'Find yours → https://tylerleonhardt.github.io/aesthetic-ranker/',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  };

  const handleReset = () => {
    reset();
    navigate('/');
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <h1 className="mb-2 text-3xl font-extrabold text-white">Your Top 3</h1>
      <p className="mb-8 text-sm text-slate-400">
        Tap an aesthetic to learn more
      </p>

      <ResultsPodium topThree={topThree} />

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleShare}
          className="min-h-[44px] rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          {copied ? 'Copied!' : 'Share Results'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="min-h-[44px] rounded-xl bg-slate-700 px-6 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
