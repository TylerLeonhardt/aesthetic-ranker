import { useState, useEffect, useCallback, useRef } from 'react';
import type { Aesthetic } from '../types';

interface AestheticCardProps {
  aesthetic: Aesthetic;
  className?: string;
  onInfoTap?: () => void;
  variant?: 'default' | 'compact';
}

export default function AestheticCard({
  aesthetic,
  className = '',
  onInfoTap,
  variant = 'default',
}: AestheticCardProps) {
  // Key forces remount on aesthetic change, resetting all state naturally
  return <AestheticCardInner key={aesthetic.urlSlug} aesthetic={aesthetic} className={className} onInfoTap={onInfoTap} variant={variant} />;
}

function AestheticCardInner({
  aesthetic,
  className,
  onInfoTap,
  variant,
}: { aesthetic: Aesthetic; className: string; onInfoTap?: () => void; variant: 'default' | 'compact' }) {
  const images = aesthetic.images?.length
    ? aesthetic.images
    : [{ url: aesthetic.displayImageUrl, title: aesthetic.name }];
  const hasMultiple = images.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [errored, setErrored] = useState<Record<number, boolean>>({});
  const interactionPause = useRef(false);

  // Auto-advance every 4s
  useEffect(() => {
    if (!hasMultiple) return;
    const timer = setInterval(() => {
      if (!interactionPause.current) {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [hasMultiple, images.length]);

  const goToImage = useCallback((idx: number) => {
    setCurrentIndex(idx);
    interactionPause.current = true;
    setTimeout(() => { interactionPause.current = false; }, 8000);
  }, []);

  const handleDotClick = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    goToImage(idx);
  }, [goToImage]);

  const currentImage = images[currentIndex];
  const isLoaded = loaded[currentIndex];
  const isErrored = errored[currentIndex];

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-800 ${className}`}>
      {/* Image — aspect-ratio defines card height */}
      <div className={`relative w-full overflow-hidden ${variant === 'compact' ? 'aspect-[4/3]' : 'aspect-[3/4]'}`}>
        {/* Info button */}
        {onInfoTap && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onInfoTap(); }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 active:bg-black/80"
            aria-label={`Details for ${aesthetic.name}`}
          >
            <span className="text-base" aria-hidden="true">ℹ️</span>
          </button>
        )}
        <img
          key={currentIndex}
          src={currentImage.url}
          alt={currentImage.title || aesthetic.name}
          loading="eager"
          draggable={false}
          onLoad={() => setLoaded((prev) => ({ ...prev, [currentIndex]: true }))}
          onError={() => setErrored((prev) => ({ ...prev, [currentIndex]: true }))}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Loading skeleton */}
        {!isLoaded && !isErrored && (
          <div className="absolute inset-0 animate-pulse bg-slate-700" />
        )}

        {/* Carousel dots with backdrop for visibility */}
        {hasMultiple && (
          <div className={`absolute inset-x-0 flex flex-col items-center gap-1 z-10 ${variant === 'compact' ? 'bottom-12' : 'bottom-16'}`}>
            <div className="flex gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 backdrop-blur-sm shadow-lg">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleDotClick(e, idx)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    idx === currentIndex
                      ? 'w-5 bg-white shadow-sm'
                      : 'w-2 bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Image ${idx + 1} of ${images.length}`}
                />
              ))}
            </div>
            <span className="animate-hint-fade text-[10px] font-medium text-white/70 drop-shadow-md pointer-events-none">
              ← more images →
            </span>
          </div>
        )}
      </div>

      {/* Dark gradient overlay at bottom */}
      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 ${variant === 'compact' ? 'pt-8' : 'pt-12'}`}>
        <h3 className="text-lg font-bold text-white leading-tight">
          {aesthetic.name}
        </h3>
        <span className="mt-1 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-slate-200 backdrop-blur-sm">
          {aesthetic.startYear} – {aesthetic.endYear}
        </span>
      </div>
    </div>
  );
}
