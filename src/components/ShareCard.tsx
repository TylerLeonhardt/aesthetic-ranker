import { useCallback, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import type { Aesthetic } from '../types';
import { calculatePercentages, getMoodBoardImages } from '../utils/results';

interface ShareCardProps {
  topThree: Aesthetic[];
  allBuckets: { like: Aesthetic[]; meh: Aesthetic[]; nope: Aesthetic[] };
  onClose: () => void;
}

export default function ShareCard({ topThree, allBuckets, onClose }: ShareCardProps) {
  const percentages = calculatePercentages(topThree, allBuckets);
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const handleSaveImage = useCallback(async () => {
    if (!cardRef.current || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      });

      // Try Web Share API with file sharing (natural on mobile)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (blob) {
        const file = new File([blob], 'my-aesthetic.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My Aesthetic' });
          return;
        }
      }

      // Fallback: download the image
      const link = document.createElement('a');
      link.download = 'my-aesthetic.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // User cancelled share or html2canvas failed — silently ignore
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (topThree.length < 3 || percentages.length < 3) return null;

  const heroImages = topThree.map((a) => getMoodBoardImages(a, 1)[0]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share your aesthetic results"
    >
      <div
        className="relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-white shadow-lg transition-colors hover:bg-slate-600"
          aria-label="Close"
        >
          ✕
        </button>

        {/* The shareable card — fixed size for consistent screenshots */}
        <div
          ref={cardRef}
          data-testid="share-card"
          className="w-[340px] overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl ring-1 ring-white/10"
        >
          {/* Header */}
          <h2 className="mb-1 text-center text-sm font-medium tracking-widest text-slate-400 uppercase">
            My Top 3 Aesthetics
          </h2>
          <div className="mx-auto mb-5 h-px w-16 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Top 3 aesthetics */}
          <div className="space-y-4">
            {topThree.map((aesthetic, index) => (
              <div key={aesthetic.urlSlug} className="flex items-center gap-3">
                {/* Rank badge */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    index === 0
                      ? 'bg-amber-500/20 text-amber-400'
                      : index === 1
                        ? 'bg-slate-400/20 text-slate-300'
                        : 'bg-orange-700/20 text-orange-400'
                  }`}
                >
                  {index + 1}
                </div>

                {/* Hero image */}
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-700">
                  <img
                    src={heroImages[index].url}
                    alt={aesthetic.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Name + percentage */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {aesthetic.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {aesthetic.startYear} – {aesthetic.endYear}
                  </p>
                </div>

                {/* Percentage */}
                <span className="shrink-0 text-sm font-bold text-indigo-400">
                  {percentages[index]}%
                </span>
              </div>
            ))}
          </div>

          {/* Percentage bar */}
          <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${percentages[0]}%` }}
            />
            <div
              className="bg-indigo-500 transition-all"
              style={{ width: `${percentages[1]}%` }}
            />
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${percentages[2]}%` }}
            />
          </div>

          {/* Percentage labels */}
          <div className="mt-2 flex justify-center gap-1 text-[10px] text-slate-500">
            <span>{percentages[0]}% {topThree[0].name}</span>
            <span>·</span>
            <span>{percentages[1]}% {topThree[1].name}</span>
            <span>·</span>
            <span>{percentages[2]}% {topThree[2].name}</span>
          </div>

          {/* Watermark */}
          <div className="mt-5 text-center">
            <p className="text-[10px] tracking-wide text-slate-600">
              tylerleonhardt.github.io/aesthetic-ranker
            </p>
          </div>
        </div>

        {/* Save / Share button */}
        <button
          type="button"
          onClick={handleSaveImage}
          disabled={saving}
          className="mt-3 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Save image"
        >
          {saving ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </>
          ) : (
            '📥 Save Image'
          )}
        </button>
      </div>
    </div>
  );
}
