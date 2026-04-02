import { useState } from 'react';
import type { Aesthetic } from '../types';
import AestheticDetail from './AestheticDetail';

interface ResultsPodiumProps {
  topThree: Aesthetic[];
}

const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
const podiumHeights = ['h-44', 'h-52', 'h-36'];
const rankLabels = ['🥈', '🥇', '🥉'];

export default function ResultsPodium({ topThree }: ResultsPodiumProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (topThree.length < 3) {
    return (
      <div className="text-center text-slate-400">
        Not enough results to display.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-end justify-center gap-3 px-2">
        {podiumOrder.map((dataIdx, visualPos) => {
          const aesthetic = topThree[dataIdx];
          return (
            <button
              key={aesthetic.name}
              type="button"
              onClick={() => setSelectedIndex(dataIdx)}
              className={`group flex w-1/3 max-w-[160px] flex-col items-center gap-2 transition-transform hover:scale-105 focus:outline-none ${visualPos === 1 ? '-mt-6' : ''}`}
            >
              {/* Rank emoji */}
              <span className="text-2xl">{rankLabels[visualPos]}</span>

              {/* Image */}
              <div
                className={`${podiumHeights[visualPos]} w-full overflow-hidden rounded-xl bg-slate-700`}
              >
                <img
                  src={aesthetic.displayImageUrl}
                  alt={aesthetic.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Name */}
              <span className="text-center text-xs font-semibold text-white leading-tight sm:text-sm">
                {aesthetic.name}
              </span>
              <span className="text-[10px] text-slate-400">
                {aesthetic.startYear} – {aesthetic.endYear}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail modal */}
      {selectedIndex !== null && (
        <AestheticDetail
          aesthetic={topThree[selectedIndex]}
          rank={selectedIndex + 1}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
