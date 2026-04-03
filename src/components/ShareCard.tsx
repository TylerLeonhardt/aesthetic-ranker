import { useCallback, useEffect, useRef, useState } from 'react';
import type { Aesthetic } from '../types';
import { getMoodBoardImages } from '../utils/results';
import { renderShareCard } from './renderShareCard';

const SHARE_URL = 'tylerleonhardt.github.io/aesthetic-ranker';
const FULL_URL = `https://${SHARE_URL}`;
const RANK_MEDALS = ['🥇', '🥈', '🥉'] as const;

interface ShareCardProps {
  topThree: Aesthetic[];
  bottomThree: Aesthetic[];
  onClose: () => void;
}

/** Try sharing a URL via Web Share API (always works on iOS Safari) */
async function tryShareUrl(): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ url: FULL_URL, title: 'My Aesthetic Ranking' });
      return true;
    } catch (err) {
      console.error('ShareCard URL share failed:', err);
    }
  }
  return false;
}

/** Try copying the URL to clipboard */
async function tryCopyUrl(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(FULL_URL);
    return true;
  } catch (err) {
    console.error('ShareCard clipboard copy failed:', err);
    return false;
  }
}

export default function ShareCard({ topThree, bottomThree, onClose }: ShareCardProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localImages, setLocalImages] = useState<Map<string, string>>(new Map());
  const [imagesReady, setImagesReady] = useState(false);
  const savingRef = useRef(false);

  // Pre-fetch images as blob URLs to avoid iOS Safari CORS cache tainting
  useEffect(() => {
    let cancelled = false;
    const blobUrls: string[] = [];

    const urls = [
      ...new Set(
        topThree.map((a) => a.images?.[0]?.url || a.displayImageUrl),
      ),
    ].filter(Boolean);

    async function prefetch() {
      const entries = await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            blobUrls.push(blobUrl);
            return [url, blobUrl] as const;
          } catch (err) {
            console.error('ShareCard image prefetch failed:', err);
            return [url, url] as const; // fallback to original URL
          }
        }),
      );
      if (!cancelled) {
        setLocalImages(new Map(entries));
        setImagesReady(true);
      } else {
        blobUrls.forEach((u) => URL.revokeObjectURL(u));
      }
    }

    prefetch();
    return () => {
      cancelled = true;
      blobUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [topThree]);

  const handleSaveImage = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const canvas = await renderShareCard(topThree, bottomThree, localImages);

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
          } catch (err) {
            console.error('ShareCard file share cancelled/failed:', err);
          }
        }
      }

      // Fallback: download the image
      const link = document.createElement('a');
      link.download = 'my-aesthetic.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('ShareCard save failed:', err);
      if (await tryShareUrl()) return;
      if (await tryCopyUrl()) {
        setError('Could not generate image. Link copied to clipboard!');
        return;
      }
      setError(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [topThree, bottomThree, localImages]);

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
                src={localImages.get(heroImages[0].url) || heroImages[0].url}
                alt={topThree[0].name}
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
                    src={localImages.get(heroImages[i + 1].url) || heroImages[i + 1].url}
                    alt={aesthetic.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom 3 — "Not My Vibe" */}
          {bottomThree.length > 0 && (
            <div className="mb-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-700" />
                <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Not My Vibe
                </span>
                <div className="h-px flex-1 bg-slate-700" />
              </div>
              <div className="space-y-1.5">
                {bottomThree.map((aesthetic) => (
                  <div
                    key={aesthetic.urlSlug}
                    className="flex items-center gap-2.5 rounded-lg bg-slate-800/30 px-3 py-1.5"
                  >
                    <span className="text-sm grayscale">💀</span>
                    <span className="truncate text-sm text-slate-500">
                      {aesthetic.name}
                    </span>
                  </div>
                ))}
              </div>
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
          disabled={saving || !imagesReady}
          className="mt-3 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Save image"
        >
          {!imagesReady ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Loading…
            </>
          ) : saving ? (
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
