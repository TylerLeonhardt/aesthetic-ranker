import { useEffect } from 'react';
import type { Aesthetic } from '../types';

interface AestheticDetailProps {
  aesthetic: Aesthetic;
  rank: number;
  onClose: () => void;
}

const rankLabels = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];

export default function AestheticDetail({
  aesthetic,
  rank,
  onClose,
}: AestheticDetailProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${aesthetic.name} details`}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-800 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Image */}
        <div className="aspect-[3/4] w-full">
          <img
            src={aesthetic.displayImageUrl}
            alt={aesthetic.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="space-y-3 p-5">
          <div className="text-sm font-semibold text-indigo-400">
            {rankLabels[rank - 1] ?? `#${rank}`}
          </div>
          <h2 className="text-2xl font-bold text-white">{aesthetic.name}</h2>
          <p className="text-sm text-slate-400">
            {aesthetic.startYear} – {aesthetic.endYear}
          </p>

          <a
            href={`https://cari.institute/aesthetics/${aesthetic.urlSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            View on CARI →
          </a>
        </div>
      </div>
    </div>
  );
}
