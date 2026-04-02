import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRankerStore } from '../store/tournament';
import type { Aesthetic } from '../types';
import AestheticCard from '../components/AestheticCard';
import AestheticDetail from '../components/AestheticDetail';

const bucketEmoji: Record<string, string> = {
  like: '👍',
  meh: '😐',
  nope: '👎',
};

const bucketLabel: Record<string, string> = {
  like: 'Likes',
  meh: 'Mehs',
  nope: 'Nopes',
};

export default function Tournament() {
  const {
    appPhase, ranker, bucketCurrent, recordComparison, reset,
    getCurrentAesthetic, getCurrentComparison, getInsertionBucket,
    getProgress, getRankerPhase, getAllRanked,
  } = useRankerStore();
  const navigate = useNavigate();
  const [detailAesthetic, setDetailAesthetic] = useState<Aesthetic | null>(null);

  useEffect(() => {
    if (appPhase === 'landing' || !ranker) {
      navigate('/', { replace: true });
    } else if (appPhase === 'results') {
      navigate('/results', { replace: true });
    }
  }, [appPhase, ranker, navigate]);

  if (!ranker || appPhase !== 'ranking') return null;

  const rankerPhase = getRankerPhase();
  const progress = getProgress();
  const buckets = getAllRanked();

  if (rankerPhase === 'bucketing') {
    const currentAesthetic = getCurrentAesthetic();
    if (!currentAesthetic) return null;

    return (
      <div className="flex min-h-dvh flex-col px-4 py-6">
        {/* Progress */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{progress.completed} of {progress.total} ranked</span>
            <span>
              {bucketEmoji.like} {buckets.like.length} | {bucketEmoji.meh} {buckets.meh.length} | {bucketEmoji.nope} {buckets.nope.length}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="flex flex-1 flex-col items-center justify-center py-4">
          <div key={currentAesthetic.urlSlug} className="animate-fade-in w-full max-w-sm mx-auto">
            <AestheticCard aesthetic={currentAesthetic} className="w-full" onInfoTap={() => setDetailAesthetic(currentAesthetic)} />
          </div>
        </div>

        {/* Bucket buttons */}
        <div className="flex gap-3 justify-center pb-4">
          <button
            type="button"
            onClick={() => bucketCurrent('nope')}
            className="min-h-[44px] flex-1 max-w-[120px] rounded-xl bg-red-600/20 px-4 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-600/30 active:bg-red-600/40"
          >
            👎 Nope
          </button>
          <button
            type="button"
            onClick={() => bucketCurrent('meh')}
            className="min-h-[44px] flex-1 max-w-[120px] rounded-xl bg-amber-600/20 px-4 py-3 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-600/30 active:bg-amber-600/40"
          >
            😐 Meh
          </button>
          <button
            type="button"
            onClick={() => bucketCurrent('like')}
            className="min-h-[44px] flex-1 max-w-[120px] rounded-xl bg-green-600/20 px-4 py-3 text-sm font-semibold text-green-400 transition-colors hover:bg-green-600/30 active:bg-green-600/40"
          >
            👍 Like
          </button>
        </div>

        {/* Start over */}
        <div className="pb-2 text-center">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Start over? Your progress will be lost.')) {
                reset();
                navigate('/');
              }
            }}
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            Start over
          </button>
        </div>

        {/* Detail modal */}
        {detailAesthetic && (
          <AestheticDetail
            aesthetic={detailAesthetic}
            onClose={() => setDetailAesthetic(null)}
          />
        )}
      </div>
    );
  }

  // Comparing mode
  if (rankerPhase === 'comparing') {
    const comparison = getCurrentComparison();
    const insertionBucket = getInsertionBucket();
    if (!comparison || !insertionBucket) return null;

    const { newItem, existingItem } = comparison;

    return (
      <div className="flex min-h-dvh flex-col px-4 py-3">
        {/* Progress */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{progress.completed} of {progress.total} ranked</span>
            <span>
              {bucketEmoji.like} {buckets.like.length} | {bucketEmoji.meh} {buckets.meh.length} | {bucketEmoji.nope} {buckets.nope.length}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Context label */}
        <div className="mt-2 text-center">
          <span className="text-sm text-slate-400">
            Ranking in your {bucketEmoji[insertionBucket]} {bucketLabel[insertionBucket]}
          </span>
          <h2 className="mt-1 text-lg font-bold text-white">Which do you prefer?</h2>
        </div>

        {/* Two cards */}
        <div className="flex flex-1 flex-col justify-center py-2">
          <div key={`${newItem.urlSlug}-vs-${existingItem.urlSlug}`} className="flex flex-col sm:flex-row gap-2 animate-fade-in">
            <button
              type="button"
              onClick={() => recordComparison('better')}
              className="flex-1 min-w-0 cursor-pointer rounded-2xl ring-2 ring-transparent transition-all duration-200 hover:ring-indigo-400 focus:outline-none focus:ring-indigo-400 active:scale-[0.98]"
            >
              <AestheticCard aesthetic={newItem} variant="compact" className="w-full" onInfoTap={() => setDetailAesthetic(newItem)} />
            </button>

            <div className="flex items-center justify-center shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                VS
              </div>
            </div>

            <button
              type="button"
              onClick={() => recordComparison('worse')}
              className="flex-1 min-w-0 cursor-pointer rounded-2xl ring-2 ring-transparent transition-all duration-200 hover:ring-indigo-400 focus:outline-none focus:ring-indigo-400 active:scale-[0.98]"
            >
              <AestheticCard aesthetic={existingItem} variant="compact" className="w-full" onInfoTap={() => setDetailAesthetic(existingItem)} />
            </button>
          </div>

          {/* Can't decide */}
          <button
            type="button"
            onClick={() => recordComparison('tie')}
            className="mx-auto mt-2 min-h-[44px] rounded-xl bg-slate-700 px-6 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600 active:bg-slate-500"
          >
            🤷 Can't decide
          </button>
        </div>

        {/* Start over */}
        <div className="pb-1 text-center">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Start over? Your progress will be lost.')) {
                reset();
                navigate('/');
              }
            }}
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            Start over
          </button>
        </div>

        {/* Detail modal */}
        {detailAesthetic && (
          <AestheticDetail
            aesthetic={detailAesthetic}
            onClose={() => setDetailAesthetic(null)}
          />
        )}
      </div>
    );
  }

  return null;
}
