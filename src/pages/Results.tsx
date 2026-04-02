import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRankerStore } from '../store/tournament';
import type { Aesthetic } from '../types';
import MoodBoard from '../components/MoodBoard';
import ShareCard from '../components/ShareCard';
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

export default function Results() {
  const { appPhase, reset, getTopThree, getAllRanked } = useRankerStore();
  const navigate = useNavigate();
  const [showShareCard, setShowShareCard] = useState(false);
  const [showFullRankings, setShowFullRankings] = useState(false);
  const [selectedAesthetic, setSelectedAesthetic] = useState<Aesthetic | null>(null);
  const fullRankingsRef = useRef<HTMLDivElement>(null);

  const topThree = getTopThree();
  const allRanked = getAllRanked();

  useEffect(() => {
    if (appPhase !== 'results' || topThree.length < 3) {
      navigate('/', { replace: true });
    }
  }, [appPhase, topThree.length, navigate]);

  if (appPhase !== 'results' || topThree.length < 3) return null;

  const handleReset = () => {
    reset();
    navigate('/');
  };

  const scrollToFullRankings = () => {
    setShowFullRankings(true);
    // Wait for render, then scroll
    requestAnimationFrame(() => {
      fullRankingsRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold text-white">
        This Is Your Aesthetic
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        Tap any aesthetic to explore
      </p>

      <MoodBoard topThree={topThree} />

      {/* Action buttons */}
      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => setShowShareCard(true)}
          className="min-h-[44px] rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Share Results
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="min-h-[44px] rounded-xl bg-slate-700 px-6 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600"
        >
          Try Again
        </button>
      </div>

      {/* Full Rankings */}
      <div ref={fullRankingsRef} className="mt-8 w-full max-w-md">
        <button
          type="button"
          onClick={showFullRankings ? () => setShowFullRankings(false) : scrollToFullRankings}
          className="flex w-full items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
        >
          <span>Full Rankings</span>
          <span className={`transition-transform ${showFullRankings ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {showFullRankings && (
          <div className="mt-2 space-y-4">
            {(['like', 'meh', 'nope'] as const).map((bucket) => {
              const items = allRanked[bucket];
              if (items.length === 0) return null;
              const emoji = bucketEmoji[bucket];
              const label = bucketLabel[bucket];
              return (
                <div key={bucket}>
                  <h3 className="mb-2 text-sm font-semibold text-slate-400">
                    {emoji} {label} ({items.length})
                  </h3>
                  <div className="space-y-1">
                    {items.map((aesthetic, index) => (
                      <button
                        key={aesthetic.urlSlug}
                        type="button"
                        onClick={() => setSelectedAesthetic(aesthetic)}
                        className="flex w-full items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2 text-left transition-colors hover:bg-slate-700/50"
                      >
                        <span className="text-xs font-medium text-slate-500 w-6 text-right">{index + 1}</span>
                        <img src={aesthetic.displayImageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{aesthetic.name}</div>
                          <div className="text-xs text-slate-400">{aesthetic.startYear} – {aesthetic.endYear}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share card modal */}
      {showShareCard && (
        <ShareCard
          topThree={topThree}
          allBuckets={allRanked}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Detail modal for full rankings */}
      {selectedAesthetic && (
        <AestheticDetail
          aesthetic={selectedAesthetic}
          rank={(() => {
            const all = [...allRanked.like, ...allRanked.meh, ...allRanked.nope];
            return all.findIndex((a) => a.urlSlug === selectedAesthetic.urlSlug) + 1;
          })()}
          onClose={() => setSelectedAesthetic(null)}
        />
      )}
    </div>
  );
}
