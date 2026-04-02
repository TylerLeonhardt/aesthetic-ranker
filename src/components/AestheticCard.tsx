import { useState } from 'react';
import type { Aesthetic } from '../types';

interface AestheticCardProps {
  aesthetic: Aesthetic;
  className?: string;
}

export default function AestheticCard({
  aesthetic,
  className = '',
}: AestheticCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-800 ${className}`}
    >
      {/* Image in normal flow — its aspect-ratio defines the card's height */}
      <img
        src={aesthetic.displayImageUrl}
        alt={aesthetic.name}
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`block w-full aspect-[3/4] object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Loading skeleton — absolutely positioned on top while image loads */}
      {!loaded && !errored && (
        <div className="absolute inset-0 animate-pulse bg-slate-700" />
      )}
      {/* Dark gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
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
