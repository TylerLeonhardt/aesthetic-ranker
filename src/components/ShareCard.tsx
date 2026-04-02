import { useCallback, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import type { Aesthetic } from '../types';
import { getMoodBoardImages } from '../utils/results';

const SHARE_URL = 'tylerleonhardt.github.io/aesthetic-ranker';
const RANK_MEDALS = ['🥇', '🥈', '🥉'] as const;

interface ShareCardProps {
  topTen: Aesthetic[];
  onClose: () => void;
}

export default function ShareCard({ topTen, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const topThree = topTen.slice(0, 3);
  const rest = topTen.slice(3, 10);

  const handleSaveImage = useCallback(async () => {
    if (!cardRef.current || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#0f172a',
      });

      // Try Web Share API with file sharing (natural on mobile)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (blob) {
        const file = new File([blob], 'my-aesthetic.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'My Aesthetic Ranking' });
            return;
          } catch {
            // User cancelled share dialog — fall through to download
          }
        }
      }

      // Fallback: download the image
      const link = document.createElement('a');
      link.download = 'my-aesthetic.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // Canvas generation failed — fall back to clipboard
      try {
        await navigator.clipboard.writeText(`https://${SHARE_URL}`);
        setError('Could not generate image. Link copied to clipboard!');
      } catch {
        setError('Could not save image. Try taking a screenshot instead.');
      }
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

  if (topThree.length < 3) return null;

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
            My Top Aesthetics
          </h2>
          <div className="mx-auto mb-5 h-px w-16 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* 🥇 #1 — Hero: full-width image */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-lg">{RANK_MEDALS[0]}</span>
              <span className="text-base font-bold text-white">{topThree[0].name}</span>
            </div>
            <div className="h-36 w-full overflow-hidden rounded-xl bg-slate-700">
              <img
                src={heroImages[0].url}
                alt={topThree[0].name}
                crossOrigin="anonymous"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* 🥈 #2 and 🥉 #3 — side by side */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            {topThree.slice(1).map((aesthetic, i) => (
              <div key={aesthetic.urlSlug}>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="text-sm">{RANK_MEDALS[i + 1]}</span>
                  <span className="truncate text-sm font-semibold text-white">
                    {aesthetic.name}
                  </span>
                </div>
                <div className="h-24 w-full overflow-hidden rounded-lg bg-slate-700">
                  <img
                    src={heroImages[i + 1].url}
                    alt={aesthetic.name}
                    crossOrigin="anonymous"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* #4-10 — compact list */}
          {rest.length > 0 && (
            <div className="mb-5 space-y-1.5">
              {rest.map((aesthetic, i) => (
                <div
                  key={aesthetic.urlSlug}
                  className="flex items-center gap-2.5 rounded-lg bg-slate-800/50 px-3 py-1.5"
                >
                  <span className="w-5 text-right text-xs font-bold text-slate-500">
                    {i + 4}.
                  </span>
                  <span className="truncate text-sm text-slate-300">
                    {aesthetic.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Watermark */}
          <div className="text-center">
            <p className="text-[10px] tracking-wide text-slate-600">
              {SHARE_URL}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p data-testid="share-error" className="mt-2 text-center text-xs text-amber-400">
            {error}
          </p>
        )}

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
