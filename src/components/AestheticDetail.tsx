import { useEffect, useState, useCallback } from 'react';
import type { Aesthetic } from '../types';

interface AestheticDetailProps {
  aesthetic: Aesthetic;
  rank?: number;
  onClose: () => void;
}

const rankLabels = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];

export default function AestheticDetail(props: AestheticDetailProps) {
  // Key forces remount on aesthetic change
  return <AestheticDetailInner key={props.aesthetic.urlSlug} {...props} />;
}

function AestheticDetailInner({
  aesthetic,
  rank,
  onClose,
}: AestheticDetailProps) {
  const images = aesthetic.images?.length
    ? aesthetic.images
    : [{ url: aesthetic.displayImageUrl, title: aesthetic.name }];
  const hasMultiple = images.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMultiple) setCurrentIndex((p) => (p - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight' && hasMultiple) setCurrentIndex((p) => (p + 1) % images.length);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, hasMultiple, images.length]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const goToImage = useCallback((idx: number) => {
    setCurrentIndex(idx);
  }, []);

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${aesthetic.name} details`}
    >
      <div
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto overflow-x-hidden rounded-2xl bg-slate-800 shadow-2xl animate-fade-in"
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

        {/* Image carousel */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <img
            key={`${aesthetic.urlSlug}-detail-${currentIndex}`}
            src={currentImage.url}
            alt={currentImage.title || aesthetic.name}
            onLoad={() => setLoaded((prev) => ({ ...prev, [currentIndex]: true }))}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              loaded[currentIndex] ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {!loaded[currentIndex] && (
            <div className="absolute inset-0 animate-pulse bg-slate-700" />
          )}

          {/* Navigation arrows */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => goToImage((currentIndex - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => goToImage((currentIndex + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {/* Dots */}
          {hasMultiple && (
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToImage(idx)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === currentIndex
                      ? 'w-4 bg-white'
                      : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Image ${idx + 1} of ${images.length}`}
                />
              ))}
            </div>
          )}

          {/* Image counter */}
          {hasMultiple && (
            <div className="absolute top-3 left-3 rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {currentIndex + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-3 p-5">
          {rank != null && (
            <div className="text-sm font-semibold text-indigo-400">
              {rankLabels[rank - 1] ?? `#${rank}`}
            </div>
          )}
          <h2 className="text-2xl font-bold text-white">{aesthetic.name}</h2>
          <p className="text-sm text-slate-400">
            {aesthetic.startYear} – {aesthetic.endYear}
          </p>

          {aesthetic.description && (
            <div className="space-y-1.5">
              <p className="text-sm leading-relaxed text-slate-300">
                {aesthetic.description}
              </p>
              <p className="text-xs italic text-slate-500">
                Description from CARI Institute
              </p>
            </div>
          )}

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
